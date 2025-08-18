import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-WEBHOOKS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    logStep("Webhook body received", body);

    // Handle different notification types
    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        logStep("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Get payment details
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!paymentResponse.ok) {
        logStep("Failed to fetch payment details", { paymentId });
        return new Response("OK", { status: 200 });
      }

      const payment = await paymentResponse.json();
      logStep("Payment details retrieved", { 
        id: payment.id, 
        status: payment.status, 
        external_reference: payment.external_reference 
      });

      if (payment.external_reference) {
        const userId = payment.external_reference;
        
        // Update subscription status based on payment status
        if (payment.status === "approved") {
          // Calculate next billing date
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);

          await supabaseClient
            .from("subscribers")
            .upsert({
              user_id: userId,
              subscribed: true,
              subscription_tier: "Premium",
              subscription_end: nextBilling.toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          logStep("Subscription activated for user", { userId });
        }
      }
    }

    if (body.type === "preapproval") {
      const preapprovalId = body.data?.id;
      if (!preapprovalId) {
        logStep("No preapproval ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Get preapproval details
      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!preapprovalResponse.ok) {
        logStep("Failed to fetch preapproval details", { preapprovalId });
        return new Response("OK", { status: 200 });
      }

      const preapproval = await preapprovalResponse.json();
      logStep("Preapproval details retrieved", { 
        id: preapproval.id, 
        status: preapproval.status, 
        external_reference: preapproval.external_reference 
      });

      if (preapproval.external_reference) {
        const userId = preapproval.external_reference;
        
        if (preapproval.status === "authorized") {
          // Subscription activated
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);

          await supabaseClient
            .from("subscribers")
            .upsert({
              user_id: userId,
              stripe_customer_id: preapprovalId,
              subscribed: true,
              subscription_tier: "Premium",
              subscription_end: nextBilling.toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          logStep("Subscription activated via preapproval", { userId });
        } else if (preapproval.status === "cancelled" || preapproval.status === "finished") {
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

          logStep("Subscription cancelled via preapproval", { userId });
        }
      }
    }

    return new Response("OK", { 
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in mercadopago-webhooks", { message: errorMessage });
    return new Response("OK", { status: 200 }); // Always return 200 to prevent webhook retries
  }
});