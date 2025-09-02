import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { subscriptionCache, getCacheKey, CACHE_TTL } from "../shared/cache.ts";
import { mercadoPagoAPICall, parseJSONWithRetry } from "../shared/retry.ts";
import { createFunctionLogger, getRequestId } from "../shared/logger.ts";

// Deno runtime global used by Supabase Edge Functions. Declare for TypeScript checks in this repo.
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createFunctionLogger("check-mercadopago-subscription");

serve(async (req) => {
  const requestId = getRequestId(req);
  const endTimer = logger.time("check-subscription-request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logger.info("Function started", undefined, undefined, requestId);

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    logger.debug(
      "MercadoPago access token verified",
      undefined,
      undefined,
      requestId
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    logger.debug(
      "Authenticating user",
      { tokenLength: token.length },
      undefined,
      requestId
    );

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email)
      throw new Error("User not authenticated or email not available");
    logger.info(
      "User authenticated",
      { userId: user.id, email: user.email },
      user.id,
      requestId
    );

    // Check cache first
    const cacheKey = getCacheKey.subscription(user.id);
    const cachedData = subscriptionCache.get(cacheKey);

    if (cachedData) {
      logger.info(
        "Returning cached subscription data",
        undefined,
        user.id,
        requestId
      );
      endTimer();
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Search for active preapprovals for this user with retry
    const searchResponse = await mercadoPagoAPICall(
      `https://api.mercadopago.com/preapproval/search?external_reference=${user.id}&status=authorized`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      logger.warn(
        "No active subscription found or API error",
        { status: searchResponse.status },
        user.id,
        requestId
      );

      // Check for existing subscriber data
      const { data: existingSubscriber } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no subscriber record exists, create one with no subscription
      if (!existingSubscriber) {
        await supabaseClient.from("subscribers").upsert(
          {
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: false,
            subscription_tier: null,
            subscription_start: null,
            subscription_end: null,
            trial_start: null,
            trial_end: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      }

      // Return no subscription data
      const noSubscriptionData = {
        message: "Nenhuma assinatura ativa encontrada",
        subscribed: false,
        subscription_tier: null,
        subscription_start: null,
        subscription_end: null,
        trial_start: null,
        trial_end: null,
        trial_days_remaining: null,
        status: null,
      };

      // Cache no subscription data
      subscriptionCache.set(
        cacheKey,
        noSubscriptionData,
        CACHE_TTL.SUBSCRIPTION_STATUS
      );

      endTimer();
      return new Response(JSON.stringify(noSubscriptionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const searchData = await parseJSONWithRetry(searchResponse);
    const activePreapprovals = (searchData.results || []).filter(
      (p: any) => p.status === "authorized"
    );

    if (activePreapprovals.length === 0) {
      logger.info(
        "No active preapprovals found",
        undefined,
        user.id,
        requestId
      );

      // Check for existing subscriber data
      const { data: existingSubscriber } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no subscriber record exists, create one with no subscription
      if (!existingSubscriber) {
        await supabaseClient.from("subscribers").upsert(
          {
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: false,
            subscription_tier: null,
            subscription_start: null,
            subscription_end: null,
            trial_start: null,
            trial_end: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      }

      // Return no subscription data
      const noSubscriptionData = {
        message: "Nenhuma assinatura ativa encontrada",
        subscribed: false,
        subscription_tier: null,
        subscription_start: null,
        subscription_end: null,
        trial_start: null,
        trial_end: null,
        trial_days_remaining: null,
        status: null,
      };

      // Cache no subscription data
      subscriptionCache.set(
        cacheKey,
        noSubscriptionData,
        CACHE_TTL.SUBSCRIPTION_STATUS
      );

      endTimer();
      return new Response(JSON.stringify(noSubscriptionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const preapproval = activePreapprovals[0];
    logger.info(
      "Active preapproval found",
      { id: preapproval.id, status: preapproval.status },
      user.id,
      requestId
    );

    // Try to fetch latest payment to extract payment method with retry
    let paymentMethod: {
      type?: string;
      last4?: string | null;
      brand?: string | null;
      exp_month?: number | null;
      exp_year?: number | null;
    } | null = null;
    let lastPaymentAmount: number | null = null;
    let lastPaymentCurrency: string | null = null;
    let lastPaymentStatus: string | null = null;
    let lastPaymentDate: string | null = null;

    try {
      const paymentsResp = await mercadoPagoAPICall(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${user.id}&sort=date_created&criteria=desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (paymentsResp.ok) {
        const paymentsJson = await parseJSONWithRetry(paymentsResp);
        const latestPayment =
          (paymentsJson.results && paymentsJson.results[0]) || null;
        if (latestPayment) {
          paymentMethod = {
            type: latestPayment.payment_method_id,
            last4:
              latestPayment.card?.last_four_digits ??
              latestPayment.card?.last4 ??
              null,
            brand: latestPayment.card?.brand ?? null,
            exp_month:
              latestPayment.card?.expiration_month ??
              latestPayment.card?.exp_month ??
              null,
            exp_year:
              latestPayment.card?.expiration_year ??
              latestPayment.card?.exp_year ??
              null,
          };

          if (typeof latestPayment.transaction_amount === "number") {
            lastPaymentAmount = Math.round(
              latestPayment.transaction_amount * 100
            );
          } else if (typeof latestPayment.amount === "number") {
            lastPaymentAmount = Math.round(latestPayment.amount * 100);
          } else {
            lastPaymentAmount = null;
          }

          lastPaymentCurrency = latestPayment.currency_id
            ? latestPayment.currency_id.toLowerCase()
            : latestPayment.currency
            ? latestPayment.currency.toLowerCase()
            : null;
          lastPaymentStatus = latestPayment.status ?? null;
          lastPaymentDate = latestPayment.date_created ?? null;
          logger.debug(
            "Latest approved payment found",
            { paymentId: latestPayment.id, payment_method: paymentMethod },
            user.id,
            requestId
          );
        } else {
          logger.debug(
            "No approved payments found for user to extract payment_method",
            undefined,
            user.id,
            requestId
          );
        }
      } else {
        logger.warn(
          "Payments search API returned non-ok for payment_method lookup",
          { status: paymentsResp.status },
          user.id,
          requestId
        );
      }
    } catch (err) {
      logger.warn(
        "Error while fetching latest payment for payment_method",
        { err: String(err) },
        user.id,
        requestId
      );
    }

    // CORREÇÃO: Verificar se há pagamentos aprovados antes de marcar como subscribed
    let hasValidPayment = false;
    let subscriptionTier = "Premium";
    let subscriptionEnd: string | null = null;

    // Só considerar subscribed se houver pelo menos um pagamento aprovado
    if (
      lastPaymentStatus === "approved" &&
      lastPaymentAmount &&
      lastPaymentAmount > 0
    ) {
      hasValidPayment = true;

      if (preapproval.date_created) {
        const createdDate = new Date(preapproval.date_created);
        const nextBilling = new Date(createdDate);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        subscriptionEnd = nextBilling.toISOString();
      }
    }

    const payment_method_type = paymentMethod?.type ?? null;
    const payment_method_brand = paymentMethod?.brand ?? null;
    const payment_method_last4 = paymentMethod?.last4 ?? null;
    const payment_method_exp_month = paymentMethod?.exp_month ?? null;
    const payment_method_exp_year = paymentMethod?.exp_year ?? null;

    const subscriptionData = {
      message: hasValidPayment
        ? "Assinatura ativa encontrada."
        : "Preapproval encontrado mas sem pagamentos válidos.",
      subscribed: hasValidPayment, // Só true se tiver pagamento aprovado
      subscription_tier: hasValidPayment ? subscriptionTier : null,
      subscription_end: hasValidPayment ? subscriptionEnd : null,
      payment_method: paymentMethod,
      payment_method_type,
      payment_method_brand,
      payment_method_last4,
      payment_method_exp_month,
      payment_method_exp_year,
      last_payment_amount: lastPaymentAmount,
      last_payment_currency: lastPaymentCurrency,
      last_payment_status: lastPaymentStatus,
      last_payment_date: lastPaymentDate,
    };

    await supabaseClient.from("subscribers").upsert(
      {
        email: user.email,
        user_id: user.id,
        stripe_customer_id: preapproval.id,
        subscribed: hasValidPayment, // Só true se tiver pagamento válido
        subscription_tier: hasValidPayment ? subscriptionTier : null,
        subscription_end: hasValidPayment ? subscriptionEnd : null,
        payment_method: paymentMethod,
        payment_method_type,
        payment_method_brand,
        payment_method_last4,
        payment_method_exp_month,
        payment_method_exp_year,
        last_payment_amount: lastPaymentAmount,
        last_payment_currency: lastPaymentCurrency,
        last_payment_status: lastPaymentStatus,
        last_payment_date: lastPaymentDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    logger.info(
      "Updated database with subscription info",
      {
        subscribed: hasValidPayment,
        subscriptionTier: hasValidPayment ? subscriptionTier : null,
      },
      user.id,
      requestId
    );

    // Cache subscription data
    subscriptionCache.set(
      cacheKey,
      subscriptionData,
      CACHE_TTL.SUBSCRIPTION_STATUS
    );

    endTimer();
    return new Response(JSON.stringify(subscriptionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error in check-mercadopago-subscription",
      { message: errorMessage },
      undefined,
      requestId
    );
    endTimer();
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
