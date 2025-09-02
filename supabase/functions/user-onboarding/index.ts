import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔄 Webhook received for user signup/confirmation");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the webhook payload
    const payload = await req.json();
    console.log("📝 Webhook payload:", JSON.stringify(payload, null, 2));

    // Extract user data from the webhook
    const { record, type, table } = payload;

    // Only process auth.users events for email confirmation
    if (table !== "users" || type !== "UPDATE") {
      console.log("⏭️ Skipping - not a user update event");
      return new Response(
        JSON.stringify({ message: "Event type not handled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is an email confirmation event
    if (!record.email_confirmed_at) {
      console.log("⏭️ Skipping - email not confirmed yet");
      return new Response(
        JSON.stringify({ message: "Email not confirmed yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = record.id;
    const userEmail = record.email;
    const userName = record.raw_user_meta_data?.name || "Usuário";
    const organizationName =
      record.raw_user_meta_data?.organization_name || "Minha Empresa";
    const telefone = record.raw_user_meta_data?.telefone || "";

    console.log(`👤 Processing confirmed user: ${userEmail} (${userId})`);

    // 1. Create or update profile
    console.log("📋 Creating/updating profile...");
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert({
        id: userId,
        email: userEmail,
        name: userName,
        organization_name: organizationName,
        telefone: telefone,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("❌ Profile creation error:", profileError);
    } else {
      console.log("✅ Profile created/updated successfully");
    }

    // 2. Create subscriber with trial
    console.log("🎯 Creating subscriber with trial...");
    const trialStart = new Date();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const { error: subscriberError } = await supabaseClient
      .from("subscribers")
      .upsert({
        user_id: userId,
        email: userEmail,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: "Trial",
        subscription_start: trialStart.toISOString(),
        subscription_end: trialEnd.toISOString(),
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (subscriberError) {
      console.error("❌ Subscriber creation error:", subscriberError);
    } else {
      console.log("✅ Trial subscriber created successfully");
    }

    // Return success response
    const response = {
      success: true,
      message: "User onboarding completed",
      userId: userId,
      email: userEmail,
      profileCreated: !profileError,
      subscriberCreated: !subscriberError,
      trialEnd: trialEnd.toISOString(),
    };

    console.log("🎉 Onboarding completed:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
