import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Deno runtime global used by Supabase Edge Functions. Declare for TypeScript checks in this repo.
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-MERCADOPAGO-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    logStep("MercadoPago access token verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Search for active preapprovals for this user
    const searchResponse = await fetch(
      `https://api.mercadopago.com/preapproval/search?external_reference=${user.id}&status=authorized`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      logStep("No active subscription found or API error", { status: searchResponse.status });

      // Define 7-day trial
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialStartISO = now.toISOString();
      const trialEndISO = trialEndDate.toISOString();
      const trialDaysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      await supabaseClient.from("subscribers").upsert(
        {
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: true,
          subscription_tier: "Trial",
          subscription_start: trialStartISO,
          subscription_end: trialEndISO,
          trial_start: trialStartISO,
          trial_end: trialEndISO,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      return new Response(
        JSON.stringify({
          message: "Cadastro realizado com sucesso. Você tem 7 dias grátis. Por favor, abra seu e-mail para ativar a conta.",
          subscribed: true,
          subscription_tier: "Trial",
          subscription_start: trialStartISO,
          subscription_end: trialEndISO,
          trial_start: trialStartISO,
          trial_end: trialEndISO,
          trial_days_remaining: trialDaysRemaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const searchData = await searchResponse.json();
    const activePreapprovals = (searchData.results || []).filter((p: any) => p.status === "authorized");

    if (activePreapprovals.length === 0) {
      logStep("No active preapprovals found");

      const now2 = new Date();
      const trialEndDate2 = new Date(now2);
      trialEndDate2.setDate(trialEndDate2.getDate() + 7);
      const trialStartISO2 = now2.toISOString();
      const trialEndISO2 = trialEndDate2.toISOString();
      const trialDaysRemaining2 = Math.ceil((trialEndDate2.getTime() - now2.getTime()) / (1000 * 60 * 60 * 24));

      await supabaseClient.from("subscribers").upsert(
        {
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: true,
          subscription_tier: "Trial",
          subscription_start: trialStartISO2,
          subscription_end: trialEndISO2,
          trial_start: trialStartISO2,
          trial_end: trialEndISO2,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      return new Response(
        JSON.stringify({
          message: "Cadastro realizado com sucesso. Você tem 7 dias grátis. Por favor, abra seu e-mail para ativar a conta.",
          subscribed: true,
          subscription_tier: "Trial",
          subscription_start: trialStartISO2,
          subscription_end: trialEndISO2,
          trial_start: trialStartISO2,
          trial_end: trialEndISO2,
          trial_days_remaining: trialDaysRemaining2,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const preapproval = activePreapprovals[0];
    logStep("Active preapproval found", { id: preapproval.id, status: preapproval.status });

    // Try to fetch latest payment to extract payment method
    let paymentMethod: { type?: string; last4?: string | null; brand?: string | null; exp_month?: number | null; exp_year?: number | null } | null = null;
    let lastPaymentAmount: number | null = null;
    let lastPaymentCurrency: string | null = null;
    let lastPaymentStatus: string | null = null;
    let lastPaymentDate: string | null = null;

    try {
      const paymentsResp = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${user.id}&sort=date_created&criteria=desc`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (paymentsResp.ok) {
        const paymentsJson = await paymentsResp.json();
        const latestPayment = (paymentsJson.results && paymentsJson.results[0]) || null;
        if (latestPayment) {
          paymentMethod = {
            type: latestPayment.payment_method_id,
            last4: latestPayment.card?.last_four_digits ?? latestPayment.card?.last4 ?? null,
            brand: latestPayment.card?.brand ?? null,
            exp_month: latestPayment.card?.expiration_month ?? latestPayment.card?.exp_month ?? null,
            exp_year: latestPayment.card?.expiration_year ?? latestPayment.card?.exp_year ?? null,
          };

          if (typeof latestPayment.transaction_amount === "number") {
            lastPaymentAmount = Math.round(latestPayment.transaction_amount * 100);
          } else if (typeof latestPayment.amount === "number") {
            lastPaymentAmount = Math.round(latestPayment.amount * 100);
          } else {
            lastPaymentAmount = null;
          }

          lastPaymentCurrency = latestPayment.currency_id ? latestPayment.currency_id.toLowerCase() : (latestPayment.currency ? latestPayment.currency.toLowerCase() : null);
          lastPaymentStatus = latestPayment.status ?? null;
          lastPaymentDate = latestPayment.date_created ?? null;
          logStep("Latest approved payment found", { paymentId: latestPayment.id, payment_method: paymentMethod });
        } else {
          logStep("No approved payments found for user to extract payment_method");
        }
      } else {
        logStep("Payments search API returned non-ok for payment_method lookup", { status: paymentsResp.status });
      }
    } catch (err) {
      logStep("Error while fetching latest payment for payment_method", { err: String(err) });
    }

    let subscriptionTier = "Premium";
    let subscriptionEnd: string | null = null;

    if (preapproval.date_created) {
      const createdDate = new Date(preapproval.date_created);
      const nextBilling = new Date(createdDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      subscriptionEnd = nextBilling.toISOString();
    }

    const payment_method_type = paymentMethod?.type ?? null;
    const payment_method_brand = paymentMethod?.brand ?? null;
    const payment_method_last4 = paymentMethod?.last4 ?? null;
    const payment_method_exp_month = paymentMethod?.exp_month ?? null;
    const payment_method_exp_year = paymentMethod?.exp_year ?? null;

    await supabaseClient.from("subscribers").upsert(
      {
        email: user.email,
        user_id: user.id,
        stripe_customer_id: preapproval.id,
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
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

    logStep("Updated database with subscription info", { subscribed: true, subscriptionTier });

    return new Response(
      JSON.stringify({
        message: "Cadastro realizado com sucesso. Por favor, abra seu e-mail para ativar a conta.",
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
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
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-mercadopago-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});