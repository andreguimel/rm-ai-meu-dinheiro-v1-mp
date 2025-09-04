import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Deprecated: Stripe payment history removed. Use 'mercadopago-payment-history' instead.
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
        "Stripe integration removed. Use 'mercadopago-payment-history' function.",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410,
    }
  );
});
