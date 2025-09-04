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
    console.log("🔄 Iniciando cancelamento...");

    // Verificar se há token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No auth header");
      throw new Error("Token necessário");
    }

    console.log("✅ Auth header presente");

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis de ambiente não configuradas");
      throw new Error("Configuração incorreta");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Cliente Supabase criado");

    // Extrair user_id do JWT
    const jwt = authHeader.replace("Bearer ", "");
    let userId: string;

    try {
      const parts = jwt.split(".");
      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
      console.log("✅ User ID:", userId);
    } catch (e) {
      console.error("❌ Erro JWT:", e);
      throw new Error("JWT inválido");
    }

    if (!userId) {
      console.error("❌ User ID vazio");
      throw new Error("User ID não encontrado");
    }

    // Buscar assinatura
    console.log("🔍 Buscando assinatura...");
    const { data: subscriber, error: subError } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subError) {
      console.error("❌ Erro ao buscar subscriber:", subError);
      throw new Error("Erro ao buscar assinatura");
    }

    if (!subscriber?.stripe_customer_id) {
      console.error("❌ Subscription ID não encontrado");
      throw new Error("Assinatura não encontrada");
    }

    console.log("✅ Subscription ID:", subscriber.stripe_customer_id);

    // Token MercadoPago
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("❌ Token MP não configurado");
      throw new Error("Token MercadoPago não configurado");
    }

    // Cancelar no MercadoPago
    console.log("🚫 Cancelando no MercadoPago...");
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriber.stripe_customer_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro MercadoPago:", response.status, errorText);
      throw new Error(`Erro MercadoPago: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Cancelado no MercadoPago:", result.status);

    // Atualizar banco
    console.log("💾 Atualizando banco...");
    const { error: updateError } = await supabase
      .from("subscribers")
      .update({ updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Erro ao atualizar:", updateError);
      // Não falhar aqui, pois o cancelamento no MP já foi feito
    }

    console.log("✅ Cancelamento concluído");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Assinatura cancelada com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Erro ao cancelar",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
