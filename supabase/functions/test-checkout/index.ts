import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Deno runtime global
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Test Edge Function started");

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasAccessToken: !!accessToken,
      supabaseUrlLength: supabaseUrl?.length || 0,
      accessTokenLength: accessToken?.length || 0,
    };

    console.log("🔧 Environment check:", envCheck);

    if (!supabaseUrl || !supabaseServiceKey || !accessToken) {
      return new Response(
        JSON.stringify({
          error: "Missing environment variables",
          details: envCheck,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🔑 Token length:", token.length);

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError) {
      console.log("❌ Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication error", details: userError }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    console.log("✅ User authenticated:", userData.user?.email);

    // Testar chamada básica para Mercado Pago
    try {
      const mpResponse = await fetch(
        "https://api.mercadopago.com/v1/payment_methods",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const mpData = await mpResponse.text();
      console.log("💳 MercadoPago API test status:", mpResponse.status);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Test completed successfully",
          user: userData.user?.email,
          mercadoPagoStatus: mpResponse.status,
          environment: envCheck,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (mpError) {
      console.log("❌ MercadoPago error:", mpError);
      return new Response(
        JSON.stringify({
          error: "MercadoPago API error",
          details: String(mpError),
          environment: envCheck,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.log("❌ General error:", error);
    return new Response(
      JSON.stringify({
        error: "General error",
        message: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
