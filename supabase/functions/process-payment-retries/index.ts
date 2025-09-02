import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createPaymentFailureManager } from "../shared/payment-failure-management.ts";
import { createFunctionLogger, getRequestId } from "../shared/logger.ts";
import { createAnalyticsTracker } from "../shared/analytics.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createFunctionLogger("process-payment-retries");

serve(async (req) => {
  const requestId = getRequestId(req);
  const endTimer = logger.time("retry-processing");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info(
      "Processing payment retries",
      { method: req.method },
      undefined,
      requestId
    );

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize payment failure manager
    const paymentFailureManager = createPaymentFailureManager(
      supabaseClient,
      accessToken
    );

    // Initialize analytics tracker
    const analyticsTracker = createAnalyticsTracker(supabaseClient);

    // Process all pending payment retries
    await paymentFailureManager.processRetryPayments();

    // Track the retry processing event
    await analyticsTracker.trackEvent({
      event_type: "payment_retries_processed",
      properties: {
        processed_at: new Date().toISOString(),
        function: "process-payment-retries",
      },
      timestamp: new Date().toISOString(),
    });

    // Get retry statistics for the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const retryStats = await paymentFailureManager.getPaymentFailureStats(
      startDate,
      endDate
    );

    logger.info(
      "Payment retries processed successfully",
      {
        stats: retryStats,
        timeframe: "30_days",
      },
      undefined,
      requestId
    );

    endTimer();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment retries processed successfully",
        stats: retryStats,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error processing payment retries",
      { message: errorMessage },
      undefined,
      requestId
    );
    endTimer();

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process payment retries",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
