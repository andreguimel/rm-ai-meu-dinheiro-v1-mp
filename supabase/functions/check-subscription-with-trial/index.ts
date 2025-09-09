import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("🔍 Check Subscription with Trial - Function started");

    // Authentication validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log("✅ User authenticated:", user.id, user.email);

    // SEMPRE consultar o status do trial primeiro
    const { data: accessStatusData, error: accessStatusError } =
      await supabaseClient.rpc("get_user_access_status", {
        check_user_id: user.id,
      });

    console.log("📊 Access Status Data:", {
      accessStatusData,
      accessStatusError,
    });

    // Handle both array and single object responses
    let accessStatus;
    if (Array.isArray(accessStatusData) && accessStatusData.length > 0) {
      accessStatus = accessStatusData[0];
    } else if (accessStatusData && !Array.isArray(accessStatusData)) {
      accessStatus = accessStatusData;
    } else {
      // Se não há dados, tentar criar trial
      console.log("🎯 No access status found - trying to create trial");

      const { data: trialCreated, error: trialError } =
        await supabaseClient.rpc("ensure_user_has_trial", {
          check_user_id: user.id,
        });

      if (trialCreated && !trialError) {
        // Buscar status novamente após criar trial
        const { data: newAccessData } = await supabaseClient.rpc(
          "get_user_access_status",
          {
            check_user_id: user.id,
          }
        );

        if (Array.isArray(newAccessData) && newAccessData.length > 0) {
          accessStatus = newAccessData[0];
        } else if (newAccessData && !Array.isArray(newAccessData)) {
          accessStatus = newAccessData;
        }
      }

      // Se ainda não há dados, usar padrão
      if (!accessStatus) {
        accessStatus = {
          has_paid_subscription: false,
          trial_active: false,
          trial_days_remaining: 0,
          access_level: "none",
          effective_subscription: false,
          subscription_tier: null,
          trial_start: null,
          trial_end: null,
        };
      }
    }

    console.log("📊 Final Access Status:", accessStatus);

    // Verificar MercadoPago apenas se necessário (para assinaturas pagas)
    let hasMercadoPagoSubscription = false;
    let mercadoPagoData = {};

    // Se já tem assinatura paga, não precisa verificar MercadoPago
    if (!accessStatus.has_paid_subscription) {
      try {
        const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        if (accessToken) {
          const searchResponse = await fetch(
            `https://api.mercadopago.com/preapproval/search?external_reference=${user.id}&status=authorized`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const activePreapprovals = (searchData.results || []).filter(
              (p: any) => p.status === "authorized"
            );

            if (activePreapprovals.length > 0) {
              hasMercadoPagoSubscription = true;
              mercadoPagoData = {
                subscription_tier: "Premium",
                subscribed: true,
                // Adicionar outros dados do MercadoPago conforme necessário
              };
            }
          }
        }
      } catch (mpError) {
        console.warn("MercadoPago API error:", mpError);
        // Continuar sem dados do MercadoPago
      }
    }

    // NOVA LÓGICA: Trial ativo = acesso liberado, independente do MercadoPago
    // Trial expirado = verificar MercadoPago, se não houver pagamento = bloquear

    const hasActiveTrial = accessStatus.trial_active;
    const hasPaidSubscription =
      hasMercadoPagoSubscription || accessStatus.has_paid_subscription;

    // Se trial está ativo, liberar acesso independente do MercadoPago
    const shouldGrantAccess = hasActiveTrial || hasPaidSubscription;

    console.log("🎯 Access Decision Logic:", {
      hasActiveTrial,
      hasPaidSubscription,
      shouldGrantAccess,
      trialDaysRemaining: accessStatus.trial_days_remaining,
    });

    const finalResponse = {
      message: hasActiveTrial
        ? `Período de teste ativo - ${accessStatus.trial_days_remaining} dias restantes`
        : hasPaidSubscription
        ? "Assinatura paga ativa"
        : "Acesso bloqueado - Trial expirado e sem assinatura paga",

      // Dados de assinatura
      subscribed: hasPaidSubscription,
      subscription_tier: hasPaidSubscription
        ? "Premium"
        : hasActiveTrial
        ? "Trial"
        : null,
      subscription_start: hasPaidSubscription ? new Date().toISOString() : null,
      subscription_end: null,

      // Dados do trial (sempre incluir)
      trial_start: accessStatus.trial_start,
      trial_end: accessStatus.trial_end,
      trial_active: accessStatus.trial_active,
      trial_days_remaining: accessStatus.trial_days_remaining,

      // Status de acesso - PRIORIZA TRIAL ATIVO
      access_level: shouldGrantAccess
        ? hasActiveTrial
          ? "trial"
          : "premium"
        : "none",
      effective_subscription: shouldGrantAccess,
      has_paid_subscription: hasPaidSubscription,

      // Outros campos
      status: shouldGrantAccess ? "active" : "inactive",
      current_period_start: null,
      current_period_end: null,
      amount: null,
      currency: null,
      cancel_at_period_end: false,
      payment_method: null,
      discount: null,
      last_payment_amount: null,
      last_payment_currency: null,
      last_payment_status: null,
    };

    console.log("✅ Final Response:", finalResponse);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in check-subscription-with-trial:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
