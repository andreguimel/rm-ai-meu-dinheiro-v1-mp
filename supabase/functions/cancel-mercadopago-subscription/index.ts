import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização necessário");
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    console.log(`🔄 Cancelando assinatura para usuário: ${user.email}`);

    // Buscar subscription_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_id, subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.subscription_id) {
      throw new Error("Assinatura não encontrada");
    }

    // Token do MercadoPago
    const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error("Token do MercadoPago não configurado");
    }

    console.log(`📋 Subscription ID: ${profile.subscription_id}`);

    // Cancelar assinatura no MercadoPago
    const cancelResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${profile.subscription_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.text();
      console.error("❌ Erro no MercadoPago:", errorData);
      throw new Error(
        `Erro ao cancelar no MercadoPago: ${cancelResponse.status}`
      );
    }

    const cancelResult = await cancelResponse.json();
    console.log("✅ Cancelamento no MercadoPago:", cancelResult);

    // Atualizar perfil no banco - remover subscription mas manter até o fim do período
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        cancel_at_period_end: true,
        updated_at: now,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Erro ao atualizar perfil:", updateError);
      throw new Error("Erro ao atualizar dados no banco");
    }

    console.log("✅ Assinatura cancelada com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Assinatura cancelada com sucesso. Você manterá acesso até o fim do período atual.",
        cancelled_at: now,
        status: "cancelled",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro no cancelamento:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Erro ao cancelar assinatura",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
