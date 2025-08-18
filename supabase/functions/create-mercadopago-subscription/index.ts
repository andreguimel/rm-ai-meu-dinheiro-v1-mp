import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MERCADOPAGO-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    logStep("MercadoPago access token verified");

    // Create preapproval (subscription) in MercadoPago
    const preapprovalData = {
      reason: "Assinatura Premium - Meu Dinheiro",
      external_reference: user.id,
      payer_email: user.email,
      back_url: `${req.headers.get("origin")}/dashboard?success=true`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 39.90,
        currency_id: "BRL"
      }
    };

    logStep("Creating preapproval", preapprovalData);

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preapprovalData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      logStep("MercadoPago API error", { status: response.status, error: errorData });
      throw new Error(`MercadoPago API error: ${response.status} - ${errorData}`);
    }

    const preapproval = await response.json();
    logStep("Preapproval created", { id: preapproval.id, init_point: preapproval.init_point });

    return new Response(JSON.stringify({ url: preapproval.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-mercadopago-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});