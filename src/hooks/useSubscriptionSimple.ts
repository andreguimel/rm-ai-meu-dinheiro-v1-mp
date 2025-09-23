import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TrialData {
  trial_active: boolean;
  trial_start: string | null;
  trial_end: string | null;
  trial_days_remaining: number | null;
}

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string | null;
  trial_active: boolean;
  access_level: "none" | "trial" | "premium";
  effective_subscription: boolean;
  has_paid_subscription: boolean;
  trial_data: TrialData;
  trial_end?: string | null;
  trial_start?: string | null;
  trial_days_remaining?: number | null;
}

interface SubscriptionState {
  data: SubscriptionData;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionSimple = () => {
  const [state, setState] = useState<SubscriptionState>({
    data: {
      subscribed: false,
      subscription_tier: null,
      trial_active: false,
      access_level: "none",
      effective_subscription: false,
      has_paid_subscription: false,
      trial_data: {
        trial_active: false,
        trial_start: null,
        trial_end: null,
        trial_days_remaining: null,
      },
      trial_end: null,
      trial_start: null,
      trial_days_remaining: null,
    },
    loading: true,
    error: null,
  });

  const { user } = useAuth();

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      console.log(
        "🎯 VERSÃO SIMPLIFICADA - Consultando apenas banco para:",
        user.email
      );

      // 1. Verificar se é admin
      const { data: isAdmin } = await supabase.rpc("is_admin");

      if (isAdmin) {
        console.log("✅ Usuário é admin");
        setState((prev) => ({
          ...prev,
          data: {
            subscribed: true,
            subscription_tier: "admin",
            trial_active: false,
            access_level: "premium",
            effective_subscription: true,
            has_paid_subscription: true,
            trial_data: {
              trial_active: false,
              trial_start: null,
              trial_end: null,
              trial_days_remaining: null,
            },
            trial_end: null,
            trial_start: null,
            trial_days_remaining: null,
          },
          loading: false,
        }));
        return;
      }

      // 2. Consultar status do banco diretamente
      const { data: accessData, error: accessError } = await supabase.rpc(
        "get_user_access_status",
        { check_user_id: user.id }
      );

      console.log("📊 Dados do banco:", JSON.stringify({ accessData, accessError }, null, 2));

      if (accessError) {
        throw new Error(`Erro ao consultar banco: ${accessError.message}`);
      }

      const accessStatus = accessData?.[0];

      if (!accessStatus) {
        console.log("🎯 Nenhum dado encontrado - tentando criar trial...");

        // Tentar criar trial
        const { data: trialCreated, error: trialError } = await supabase.rpc(
          "ensure_user_has_trial",
          { check_user_id: user.id }
        );

        if (trialCreated && !trialError) {
          console.log("✅ Trial criado - consultando novamente...");

          // Consultar novamente após criar trial
          const { data: newAccessData } = await supabase.rpc(
            "get_user_access_status",
            {
              check_user_id: user.id,
            }
          );

          if (newAccessData?.[0]) {
            console.log("📊 Novos dados após criação:", newAccessData[0]);
            const newStatus = newAccessData[0];

            setState((prev) => ({
              ...prev,
              data: {
                subscribed: newStatus.has_paid_subscription || false,
                subscription_tier: newStatus.subscription_tier,
                trial_active: newStatus.trial_active || false,
                access_level: newStatus.access_level || "none",
                effective_subscription:
                  newStatus.effective_subscription || false,
                has_paid_subscription: newStatus.has_paid_subscription || false,
                trial_data: {
                  trial_active: newStatus.trial_active || false,
                  trial_start: newStatus.trial_start,
                  trial_end: newStatus.trial_end,
                  trial_days_remaining: newStatus.trial_days_remaining || 0,
                },
                trial_end: newStatus.trial_end,
                trial_start: newStatus.trial_start,
                trial_days_remaining: newStatus.trial_days_remaining || 0,
              },
              loading: false,
            }));
            return;
          }
        }

        // Se não conseguiu criar trial, sem acesso
        setState((prev) => ({
          ...prev,
          data: {
            subscribed: false,
            subscription_tier: null,
            trial_active: false,
            access_level: "none",
            effective_subscription: false,
            has_paid_subscription: false,
            trial_data: {
              trial_active: false,
              trial_start: null,
              trial_end: null,
              trial_days_remaining: null,
            },
            trial_end: null,
            trial_start: null,
            trial_days_remaining: null,
          },
          loading: false,
        }));
        return;
      }

      // 3. Processar dados do banco
      console.log("✅ Processando dados do banco:", accessStatus);

      const finalData: SubscriptionData = {
        subscribed: accessStatus.has_paid_subscription || false,
        subscription_tier: accessStatus.subscription_tier,
        trial_active: accessStatus.trial_active || false,
        access_level: accessStatus.access_level || "none",
        effective_subscription: accessStatus.effective_subscription || false,
        has_paid_subscription: accessStatus.has_paid_subscription || false,
        trial_data: {
          trial_active: accessStatus.trial_active || false,
          trial_start: accessStatus.trial_start,
          trial_end: accessStatus.trial_end,
          trial_days_remaining: accessStatus.trial_days_remaining || 0,
        },
        trial_end: accessStatus.trial_end,
        trial_start: accessStatus.trial_start,
        trial_days_remaining: accessStatus.trial_days_remaining || 0,
      };

      console.log("🎉 DADOS FINAIS SIMPLIFICADOS:", finalData);
      console.log("🔍 VERIFICAÇÃO:");
      console.log("  - Trial Ativo:", finalData.trial_active);
      console.log("  - Access Level:", finalData.access_level);
      console.log(
        "  - Effective Subscription:",
        finalData.effective_subscription
      );

      setState((prev) => ({
        ...prev,
        data: finalData,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      console.error("❌ Erro na verificação simplificada:", error);

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    subscriptionData: state.data,
    loading: state.loading,
    error: state.error,
    refetch: checkSubscription,
  };
};
