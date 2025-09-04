import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

declare const Deno: any;

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
    console.log("🔄 Iniciando cancelamento de assinatura...");

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    console.log("🔑 AuthHeader present:", !!authHeader);

    if (!authHeader) {
      console.error("❌ Token de autorização não fornecido");
      throw new Error("Token de autorização necessário");
    }

    // Criar cliente Supabase com Service Role Key para operações privilegiadas
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar o JWT manualmente para obter o user_id
    const jwt = authHeader.replace("Bearer ", "");
    console.log("🎫 JWT length:", jwt.length);

    // Decodificar o JWT para extrair o user_id (validação básica)
    let userId: string;
    try {
      const parts = jwt.split(".");
      if (parts.length !== 3) {
        throw new Error("JWT format inválido");
      }

      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
      console.log("👤 User ID extraído:", userId);

      if (!userId) {
        throw new Error("User ID não encontrado no JWT");
      }
    } catch (jwtError) {
      console.error("❌ Erro ao decodificar JWT:", jwtError);
      throw new Error("Token de autorização inválido");
    }

    console.log(`🔄 Cancelando assinatura para usuário: ${userId}`);

    // Buscar subscription_id do usuário - primeiro verificar se a coluna existe
    console.log("🔍 Buscando assinatura...");

    // Tentar buscar com stripe_customer_id primeiro
    let { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    // Se a coluna stripe_customer_id não existir, tentar só verificar se o usuário existe
    if (subscriberError && subscriberError.code === "42703") {
      console.log(
        "⚠️ Coluna stripe_customer_id não existe, verificando usuário..."
      );
      const { data: userCheck, error: userError } = await supabase
        .from("subscribers")
        .select("user_id, email")
        .eq("user_id", userId)
        .single();

      if (userError || !userCheck) {
        console.error("❌ Usuário não encontrado na tabela subscribers");
        throw new Error("Usuário não é assinante");
      }

      console.log(
        "❌ Sistema em migração - cancelamento temporariamente indisponível"
      );
      throw new Error(
        "Sistema em migração - tente novamente em alguns minutos"
      );
    }

    if (subscriberError) {
      console.error("❌ Erro ao buscar subscriber:", subscriberError);
      throw new Error("Erro ao buscar assinatura");
    }

    if (!subscriber?.stripe_customer_id) {
      console.error("❌ Subscription ID não encontrado");
      throw new Error(
        "Assinatura não encontrada - ID do MercadoPago não disponível"
      );
    }

    // Token do MercadoPago
    const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error("Token do MercadoPago não configurado");
    }

    console.log(`📋 Subscription ID: ${subscriber.stripe_customer_id}`);

    // Cancelar assinatura no MercadoPago
    const cancelResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriber.stripe_customer_id}`,
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

    // Atualizar subscriber no banco - usar campos que existem com certeza
    const now = new Date().toISOString();

    // Primeiro, tentar com os novos campos
    let updateResult = await supabase
      .from("subscribers")
      .update({
        cancel_at_period_end: true,
        cancelled_at: now,
        updated_at: now,
      })
      .eq("user_id", userId);

    // Se falhar (colunas não existem), tentar apenas com updated_at
    if (updateResult.error) {
      console.log("⚠️ Campos de cancelamento não existem, usando fallback...");
      updateResult = await supabase
        .from("subscribers")
        .update({
          updated_at: now,
        })
        .eq("user_id", userId);
    }

    if (updateResult.error) {
      console.error("❌ Erro ao atualizar subscriber:", updateResult.error);
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
