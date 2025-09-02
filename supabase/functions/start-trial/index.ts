import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[START-TRIAL] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has a subscriber record
    const { data: existing, error: existingErr } = await supabaseClient
      .from("subscribers")
      .select("trial_start, trial_end, subscribed, subscription_tier")
      .eq("user_id", user.id)
      .eq("email", user.email)
      .maybeSingle();

    if (existingErr) {
      logStep("Error fetching existing subscriber", { err: existingErr });
      throw new Error(`Database error: ${existingErr.message}`);
    }

    // If user already has a trial or subscription, don't create a new one
    if (existing) {
      logStep("User already has subscription record", existing);
      return new Response(
        JSON.stringify({
          message: "Usuário já possui um registro de assinatura.",
          trial_already_exists: true,
          subscribed: existing.subscribed ?? false,
          subscription_tier: existing.subscription_tier ?? "Trial",
          trial_start: existing.trial_start,
          trial_end: existing.trial_end,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create a new 7-day trial
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const trialStartISO = now.toISOString();
    const trialEndISO = trialEndDate.toISOString();
    const trialDaysRemaining = 7;

    logStep("Creating new trial period", {
      userId: user.id,
      email: user.email,
      trialStart: trialStartISO,
      trialEnd: trialEndISO,
      daysRemaining: trialDaysRemaining
    });

    // Insert new subscriber record with trial
    const { error: insertError } = await supabaseClient.from("subscribers").insert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: null,
      subscribed: false,
      subscription_tier: "Trial",
      subscription_start: trialStartISO,
      subscription_end: trialEndISO,
      trial_start: trialStartISO,
      trial_end: trialEndISO,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      logStep("Error creating trial record", { error: insertError });
      throw new Error(`Failed to create trial: ${insertError.message}`);
    }

    logStep("Trial period created successfully", {
      userId: user.id,
      trialDaysRemaining
    });

    return new Response(
      JSON.stringify({
        message: "Período de teste iniciado com sucesso! Você tem 7 dias grátis.",
        subscribed: false,
        subscription_tier: "Trial",
        subscription_start: trialStartISO,
        subscription_end: trialEndISO,
        trial_start: trialStartISO,
        trial_end: trialEndISO,
        trial_days_remaining: trialDaysRemaining,
        trial_created: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in start-trial", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
