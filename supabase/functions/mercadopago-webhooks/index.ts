import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  validateWebhook,
  markWebhookProcessed,
} from "../shared/webhook-validation.ts";
import { subscriptionCache, getCacheKey } from "../shared/cache.ts";
import { mercadoPagoAPICall, parseJSONWithRetry } from "../shared/retry.ts";
import { createFunctionLogger, getRequestId } from "../shared/logger.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createFunctionLogger("mercadopago-webhooks");

serve(async (req) => {
  const requestId = getRequestId(req);
  const endTimer = logger.time("webhook-request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info(
      "Webhook received",
      { method: req.method, url: req.url },
      undefined,
      requestId
    );

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const rawBody = await req.text();
    const signature =
      req.headers.get("x-signature") ||
      req.headers.get("x-mercadopago-signature");

    // Validate webhook
    const validation = await validateWebhook(
      rawBody,
      signature || undefined,
      webhookSecret
    );

    if (!validation.valid) {
      logger.warn(
        "Webhook validation failed",
        { error: validation.error },
        undefined,
        requestId
      );
      // Still return 200 to prevent webhook retries for invalid requests
      return new Response("OK", { status: 200 });
    }

    const { event, eventId } = validation;
    if (!event || !eventId) {
      logger.error(
        "Missing event or eventId after validation",
        undefined,
        undefined,
        requestId
      );
      return new Response("OK", { status: 200 });
    }

    logger.info(
      "Webhook validated",
      {
        type: event.type,
        eventId,
        dataId: event.data?.id,
      },
      undefined,
      requestId
    );

    // Handle different notification types
    if (event.type === "payment") {
      await handlePaymentWebhook(event, supabaseClient, accessToken, requestId);
    } else if (event.type === "preapproval") {
      await handlePreapprovalWebhook(
        event,
        supabaseClient,
        accessToken,
        requestId
      );
    } else {
      logger.info(
        "Unhandled webhook type",
        { type: event.type },
        undefined,
        requestId
      );
    }

    // Mark webhook as processed
    markWebhookProcessed(eventId);

    endTimer();
    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error in mercadopago-webhooks",
      { message: errorMessage },
      undefined,
      requestId
    );
    endTimer();
    return new Response("OK", { status: 200 }); // Always return 200 to prevent webhook retries
  }
});

async function handlePaymentWebhook(
  event: any,
  supabaseClient: any,
  accessToken: string,
  requestId: string
): Promise<void> {
  const paymentId = event.data?.id;
  if (!paymentId) {
    logger.warn("No payment ID in webhook", undefined, undefined, requestId);
    return;
  }

  try {
    // Get payment details with retry
    const paymentResponse = await mercadoPagoAPICall(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paymentResponse.ok) {
      logger.warn(
        "Failed to fetch payment details",
        { paymentId, status: paymentResponse.status },
        undefined,
        requestId
      );
      return;
    }

    const payment = await parseJSONWithRetry(paymentResponse);
    logger.info(
      "Payment details retrieved",
      {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
        amount: payment.transaction_amount,
      },
      undefined,
      requestId
    );

    if (payment.external_reference) {
      const userId = payment.external_reference;

      // Update subscription status based on payment status
      if (payment.status === "approved") {
        // Calculate next billing date
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        await supabaseClient.from("subscribers").upsert(
          {
            user_id: userId,
            subscribed: true,
            subscription_tier: "Premium",
            subscription_end: nextBilling.toISOString(),
            last_payment_amount: Math.round(
              (payment.transaction_amount || 0) * 100
            ),
            last_payment_currency: (payment.currency_id || "brl").toLowerCase(),
            last_payment_status: payment.status,
            last_payment_date: payment.date_created,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Invalidate cache
        subscriptionCache.invalidate(getCacheKey.subscription(userId));

        logger.info(
          "Subscription activated for user via payment",
          { userId, paymentId },
          userId,
          requestId
        );
      } else if (
        payment.status === "rejected" ||
        payment.status === "cancelled"
      ) {
        logger.info(
          "Payment failed, no action taken",
          { userId, paymentId, status: payment.status },
          userId,
          requestId
        );
      }
    }
  } catch (error) {
    logger.error(
      "Error handling payment webhook",
      {
        error: error instanceof Error ? error.message : String(error),
        paymentId,
      },
      undefined,
      requestId
    );
  }
}

async function handlePreapprovalWebhook(
  event: any,
  supabaseClient: any,
  accessToken: string,
  requestId: string
): Promise<void> {
  const preapprovalId = event.data?.id;
  if (!preapprovalId) {
    logger.warn(
      "No preapproval ID in webhook",
      undefined,
      undefined,
      requestId
    );
    return;
  }

  try {
    // Get preapproval details with retry
    const preapprovalResponse = await mercadoPagoAPICall(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!preapprovalResponse.ok) {
      logger.warn(
        "Failed to fetch preapproval details",
        { preapprovalId, status: preapprovalResponse.status },
        undefined,
        requestId
      );
      return;
    }

    const preapproval = await parseJSONWithRetry(preapprovalResponse);
    logger.info(
      "Preapproval details retrieved",
      {
        id: preapproval.id,
        status: preapproval.status,
        external_reference: preapproval.external_reference,
      },
      undefined,
      requestId
    );

    if (preapproval.external_reference) {
      const userId = preapproval.external_reference;

      if (preapproval.status === "authorized") {
        // Subscription activated
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        await supabaseClient.from("subscribers").upsert(
          {
            user_id: userId,
            stripe_customer_id: preapprovalId,
            subscribed: true,
            subscription_tier: "Premium",
            subscription_end: nextBilling.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Invalidate cache
        subscriptionCache.invalidate(getCacheKey.subscription(userId));

        logger.info(
          "Subscription activated via preapproval",
          { userId, preapprovalId },
          userId,
          requestId
        );
      } else if (
        preapproval.status === "cancelled" ||
        preapproval.status === "finished"
      ) {
        // Subscription cancelled/ended
        await supabaseClient
          .from("subscribers")
          .update({
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Invalidate cache
        subscriptionCache.invalidate(getCacheKey.subscription(userId));

        logger.info(
          "Subscription cancelled via preapproval",
          { userId, preapprovalId },
          userId,
          requestId
        );
      }
    }
  } catch (error) {
    logger.error(
      "Error handling preapproval webhook",
      {
        error: error instanceof Error ? error.message : String(error),
        preapprovalId,
      },
      undefined,
      requestId
    );
  }
}
