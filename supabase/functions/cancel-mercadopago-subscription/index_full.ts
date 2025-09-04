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

    // Buscar assinatura do usuário na tabela subscribers
    console.log("🔍 Buscando assinatura...");

    // Primeiro, vamos tentar buscar todas as colunas disponíveis para ver a estrutura
    const { data: allColumns, error: columnsError } = await supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (columnsError) {
      console.error("❌ Erro ao buscar subscriber:", columnsError);
      throw new Error("Erro ao buscar assinatura");
    }

    if (!allColumns) {
      console.error("❌ Usuário não encontrado na tabela subscribers");
      throw new Error("Usuário não é assinante");
    }

    console.log("📋 Dados do subscriber:", Object.keys(allColumns));

    // Verificar se tem o ID do MercadoPago
    const mpId =
      allColumns.stripe_customer_id ||
      allColumns.mercadopago_id ||
      allColumns.subscription_id;

    if (!mpId) {
      console.error("❌ ID do MercadoPago não encontrado");
      console.log("📊 Dados disponíveis:", allColumns);
      throw new Error("ID da assinatura no MercadoPago não encontrado");
    }

    console.log("✅ MercadoPago ID:", mpId);

    // Token MercadoPago
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("❌ Token MP não configurado");
      throw new Error("Token MercadoPago não configurado");
    }

    // Cancelar no MercadoPago
    console.log("🚫 Cancelando no MercadoPago...");
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${mpId}`,
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
      throw new Error(`Erro MercadoPago: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Cancelado no MercadoPago:", result.status);

    // Atualizar banco de dados
    console.log("💾 Atualizando banco...");
    const updateData: any = { updated_at: new Date().toISOString() };

    // Tentar adicionar campos de cancelamento se existirem
    if ("cancel_at_period_end" in allColumns) {
      updateData.cancel_at_period_end = true;
    }
    if ("cancelled_at" in allColumns) {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("subscribers")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Erro ao atualizar:", updateError);
      // Não falhar aqui, pois o cancelamento no MP já foi feito
      console.log("⚠️ Cancelamento no MP foi feito, mas falha ao atualizar DB");
    } else {
      console.log("✅ Banco atualizado");
    }

    console.log("✅ Cancelamento concluído com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Assinatura cancelada com sucesso no MercadoPago. Você manterá acesso até o fim do período atual.",
        mercadopago_status: result.status,
        cancelled_at: new Date().toISOString(),
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
        details: "Erro ao cancelar assinatura",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
