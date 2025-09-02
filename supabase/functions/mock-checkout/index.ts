import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.log("🚀 Mock checkout function started");

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      throw new Error(`Authentication error: ${userError?.message}`);
    }

    const user = userData.user;
    console.log("✅ User authenticated:", user.email);

    // Simular checkout do Mercado Pago
    const origin = req.headers.get("origin") || "http://localhost:8082";

    // URL mock para simular o processo de pagamento
    const mockCheckoutUrl = `${origin}/perfil?mock_payment=true&plan=monthly&user_id=${user.id}&status=pending`;

    console.log("🎭 Mock checkout URL created:", mockCheckoutUrl);

    // Simular resposta do Mercado Pago
    const mockResponse = {
      url: mockCheckoutUrl,
      plan: {
        id: "monthly",
        name: "Premium Mock",
        amount: 39.9,
        currency: "BRL",
      },
      mock: true,
      message: "Checkout mock criado - Token do Mercado Pago está inválido",
    };

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error in mock checkout:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
