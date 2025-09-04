import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Deprecated: Stripe customer portal removed. Use MercadoPago manage-mercadopago-subscription endpoint instead.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error:
        "Stripe customer portal removed. Use 'manage-mercadopago-subscription' to manage MercadoPago subscriptions.",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410,
    }
  );
});
