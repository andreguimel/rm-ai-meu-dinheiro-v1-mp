import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-PAYMENT-HISTORY] ${step}${detailsStr}`);
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

    // Search for payments associated with this user - with security validation
    const paymentsResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${user.id}&sort=date_created&criteria=desc&range=date_created&begin_date=NOW-1YEAR&end_date=NOW`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!paymentsResponse.ok) {
      logStep("No payments found or API error", { status: paymentsResponse.status });
      return new Response(JSON.stringify({ payments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentsData = await paymentsResponse.json();
    const payments = paymentsData.results || [];

    // CRITICAL: Filter payments to ensure they belong to current user only
    const userPayments = payments.filter((payment: any) => {
      const belongsToUser = payment.external_reference === user.id;
      if (!belongsToUser) {
        logStep("SECURITY WARNING: Payment does not belong to current user", { 
          payment_id: payment.id,
          payment_external_ref: payment.external_reference, 
          user_id: user.id 
        });
      }
      return belongsToUser;
    });

    const formattedPayments = userPayments.map((payment: any) => ({
      id: payment.id,
      amount: payment.transaction_amount * 100, // Convert to cents for compatibility
      currency: payment.currency_id.toLowerCase(),
      status: payment.status,
      created: Math.floor(new Date(payment.date_created).getTime() / 1000),
      description: payment.description || "Assinatura Premium",
      receipt_url: null, // MercadoPago doesn't provide direct receipt URLs
      payment_method_details: {
        type: payment.payment_method_id,
        card: payment.card ? {
          brand: payment.card.first_six_digits ? 'card' : null,
          last4: payment.card.last_four_digits || null,
        } : null,
      },
    }));

    logStep("Payment history retrieved and validated", { count: formattedPayments.length, userId: user.id });

    return new Response(JSON.stringify({ payments: formattedPayments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in mercadopago-payment-history", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});