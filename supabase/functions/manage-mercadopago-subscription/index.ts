import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-MERCADOPAGO-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    logStep("MercadoPago access token verified");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get current subscription from database
    const { data: subscriber } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!subscriber || !subscriber.subscribed || !subscriber.stripe_customer_id) {
      throw new Error("No active subscription found for this user");
    }

    const preapprovalId = subscriber.stripe_customer_id;
    logStep("Found active subscription", { preapprovalId });

    // For MercadoPago, we'll provide options to cancel the subscription
    // Since there's no direct "customer portal" like Stripe, we create our own management interface
    const { action } = await req.json();

    if (action === 'cancel') {
      logStep("Canceling subscription", { preapprovalId });
      
      const cancelResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "cancelled"
        })
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.text();
        logStep("Error canceling subscription", { status: cancelResponse.status, error: errorData });
        throw new Error(`Failed to cancel subscription: ${errorData}`);
      }

      // Update database
      await supabaseClient
        .from("subscribers")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("email", user.email);

      logStep("Subscription cancelled successfully");
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Assinatura cancelada com sucesso",
        redirect_url: `${req.headers.get("origin")}/dashboard`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Default response - return subscription management info
    return new Response(JSON.stringify({ 
      subscription_id: preapprovalId,
      status: "active",
      management_options: [
        { action: "cancel", label: "Cancelar Assinatura" }
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manage-mercadopago-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});