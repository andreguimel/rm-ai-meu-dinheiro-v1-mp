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
    console.log("🚀 Simple checkout function started");

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!supabaseUrl || !supabaseServiceKey || !accessToken) {
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

    // Criar preapproval no Mercado Pago
    const preapprovalData = {
      reason: "Assinatura Premium - Meu Dinheiro",
      external_reference: user.id,
      payer_email: user.email,
      back_url: "https://exemplo.com/success",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 39.9,
        currency_id: "BRL",
      },
      metadata: {
        plan_id: "monthly",
        plan_name: "Premium",
        user_id: user.id,
      },
    };

    console.log("📝 Creating preapproval:", {
      user: user.email,
      amount: 39.9,
      plan: "monthly",
    });

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ MercadoPago API error:", response.status, errorText);
      throw new Error(
        `MercadoPago API error: ${response.status} - ${errorText}`
      );
    }

    const preapproval = await response.json();

    console.log("✅ Preapproval created:", {
      id: preapproval.id,
      status: preapproval.status,
      hasInitPoint: !!preapproval.init_point,
    });

    if (!preapproval.init_point) {
      throw new Error("MercadoPago did not return a checkout URL");
    }

    return new Response(
      JSON.stringify({
        url: preapproval.init_point,
        plan: {
          id: "monthly",
          name: "Premium",
          amount: 39.9,
          currency: "BRL",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in simple checkout:", error);
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
