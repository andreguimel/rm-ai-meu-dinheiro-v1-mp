import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  SUBSCRIPTION_PLANS,
  getPlan,
  DEFAULT_PLAN,
} from "../shared/subscription-plans.ts";
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

const logger = createFunctionLogger("create-mercadopago-subscription");

serve(async (req) => {
  const requestId = getRequestId(req);
  const endTimer = logger.time("create-subscription-request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client using the service role key for admin operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logger.info("Function started", undefined, undefined, requestId);

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    logger.debug(
      "Checking environment variables",
      {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseServiceKey: !!supabaseServiceKey,
        hasAccessToken: !!accessToken,
      },
      undefined,
      requestId
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error(
        "Missing Supabase environment variables",
        {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
        },
        undefined,
        requestId
      );
      throw new Error("Missing Supabase environment variables");
    }
    if (!accessToken) {
      logger.error(
        "MERCADOPAGO_ACCESS_TOKEN is not set",
        undefined,
        undefined,
        requestId
      );
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    }
    logger.debug(
      "Environment variables validated",
      undefined,
      undefined,
      requestId
    );

    // Validate request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    logger.debug(
      "Authenticating user",
      { tokenLength: token.length },
      undefined,
      requestId
    );

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) {
      logger.error(
        "Authentication error",
        { error: userError.message, code: userError.status },
        undefined,
        requestId
      );
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      logger.error(
        "User validation failed",
        { user: !!user, email: user?.email },
        undefined,
        requestId
      );
      throw new Error("User not authenticated or email not available");
    }
    logger.info(
      "User authenticated",
      { userId: user.id, email: user.email },
      user.id,
      requestId
    );

    // Parse request body to get plan selection
    let requestBody: { planId?: string } = {};
    try {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        requestBody = await req.json();
      }
    } catch {
      // Use default plan if no body or parsing error
    }

    const planId = requestBody.planId || DEFAULT_PLAN;
    const plan = getPlan(planId);

    if (!plan) {
      logger.error("Invalid plan selected", { planId }, user.id, requestId);
      throw new Error(`Invalid subscription plan: ${planId}`);
    }

    logger.info(
      "Plan selected",
      { planId: plan.id, amount: plan.amount },
      user.id,
      requestId
    );

    // Check cache for existing preapproval
    const cacheKey = getCacheKey.preapproval(user.id);
    const cachedPreapproval = subscriptionCache.get(cacheKey);

    if (cachedPreapproval) {
      logger.info(
        "Returning cached preapproval",
        { id: cachedPreapproval.id },
        user.id,
        requestId
      );
      return new Response(
        JSON.stringify({ url: cachedPreapproval.init_point }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create preapproval (subscription) in MercadoPago
    const origin = req.headers.get("origin") || "http://localhost:8081";
    const preapprovalData = {
      reason: `Assinatura ${plan.name} - Meu Dinheiro`,
      external_reference: user.id,
      payer_email: user.email,
      back_url: `${origin}/perfil?success=true&plan=${planId}`,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: plan.currency,
      },
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        user_id: user.id,
      },
    };

    logger.info(
      "Creating preapproval",
      {
        planId,
        amount: plan.amount,
        frequency: `${plan.frequency} ${plan.frequency_type}`,
      },
      user.id,
      requestId
    );

    const response = await mercadoPagoAPICall(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preapprovalData),
      }
    );

    const preapproval = await parseJSONWithRetry(response);

    logger.info(
      "Preapproval created successfully",
      {
        id: preapproval.id,
        init_point: !!preapproval.init_point,
        status: preapproval.status,
      },
      user.id,
      requestId
    );

    if (!preapproval.init_point) {
      throw new Error("MercadoPago did not return a checkout URL (init_point)");
    }

    // Cache the preapproval for 10 minutes
    subscriptionCache.set(cacheKey, preapproval, 10 * 60 * 1000);

    endTimer();
    return new Response(
      JSON.stringify({
        url: preapproval.init_point,
        plan: plan,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error in create-mercadopago-subscription",
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
