import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  subscription_end?: string | null;
  subscription_start?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  cancel_at_period_end?: boolean | null;
  trial_end?: string | null;
  trial_start?: string | null;
  trial_days_remaining?: number | null;
  // Enhanced trial fields - core trial functionality
  trial_active: boolean;
  access_level: "none" | "trial" | "premium";
  effective_subscription: boolean; // trial ativo OU assinatura paga
  has_paid_subscription: boolean;
  trial_data: TrialData;
  payment_method?: any | null;
  discount?: any | null;
  last_payment_amount?: number | null;
  last_payment_currency?: string | null;
  last_payment_status?: string | null;
}

interface SubscriptionState {
  data: SubscriptionData;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionDirect = () => {
  const [state, setState] = useState<SubscriptionState>({
    data: {
      subscribed: false,
      subscription_tier: null,
      subscription_end: null,
      subscription_start: null,
      current_period_start: null,
      current_period_end: null,
      amount: null,
      currency: null,
      status: null,
      cancel_at_period_end: null,
      trial_end: null,
      trial_start: null,
      trial_days_remaining: null,
      // Enhanced trial fields - required fields with proper defaults
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
      payment_method: null,
      discount: null,
    },
    loading: true,
    error: null,
  });

  const { toast } = useToast();
  const { user, session } = useAuth();

  // Definir dados de assinatura
  const setSubscriptionData = useCallback((data: SubscriptionData) => {
    setState((prev) => ({ ...prev, data, error: null }));
  }, []);

  // Definir loading
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  // Definir erro
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Verificar assinatura APENAS do banco de dados
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔍 [DIRECT] Verificando assinatura APENAS do banco para usuário:",
        user.email
      );

      // 1. Primeiro verificar se é admin
      const { data: isAdmin, error: adminError } = await supabase.rpc(
        "is_admin"
      );

      if (adminError) {
        console.error("Erro ao verificar admin:", adminError);
      }

      if (isAdmin) {
        console.log("✅ [DIRECT] Usuário é admin - definindo acesso completo");
        setSubscriptionData({
          subscribed: true,
          subscription_tier: "admin",
          status: "active",
          subscription_start: new Date().toISOString(),
          subscription_end: null,
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          amount: null,
          currency: null,
          cancel_at_period_end: false,
          trial_end: null,
          trial_start: null,
          trial_days_remaining: null,
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
          payment_method: null,
          discount: null,
        });
        return;
      }

      // 2. Buscar dados EXCLUSIVAMENTE do banco de dados
      console.log(
        "🔍 [DIRECT] Buscando dados do banco via get_user_access_status..."
      );
      const { data: bankData, error: bankError } = await supabase.rpc(
        "get_user_access_status",
        {
          check_user_id: user.id,
        }
      );

      console.log("📊 [DIRECT] Dados do banco:", JSON.stringify({ bankData, bankError }, null, 2));

      if (bankError) {
        console.error("❌ [DIRECT] Erro ao buscar dados do banco:", bankError);
        setError(`Erro ao verificar dados do banco: ${bankError.message}`);
        return;
      }

      if (!bankData || (Array.isArray(bankData) && bankData.length === 0)) {
        console.warn("⚠️ [DIRECT] Nenhum dado encontrado no banco");
        setError("Nenhum dado de assinatura encontrado");
        return;
      }

      // Processar dados do banco
      const trialData = Array.isArray(bankData) ? bankData[0] : bankData;
      console.log("🎯 [DIRECT] Processando dados do banco:", trialData);

      // APLICAR NOVA LÓGICA: Trial ativo = acesso liberado
      const trialActive = trialData.trial_active ?? false;
      const hasPaidSubscription = trialData.has_paid_subscription ?? false;
      const shouldGrantAccess = trialActive || hasPaidSubscription;

      console.log("🎯 [DIRECT] NOVA LÓGICA DE ACESSO:", {
        trialActive,
        hasPaidSubscription,
        shouldGrantAccess,
        accessLevel: trialData.access_level,
        effectiveSubscription: trialData.effective_subscription,
        logic: trialActive
          ? "✅ TRIAL ATIVO - Acesso liberado (dados diretos do banco)"
          : hasPaidSubscription
          ? "✅ PAGAMENTO CONFIRMADO - Acesso liberado (dados diretos do banco)"
          : "❌ ACESSO BLOQUEADO - Trial expirado e sem pagamento (dados diretos do banco)",
      });

      // Criar estrutura de dados normalizada
      const trialDataStructure: TrialData = {
        trial_active: trialActive,
        trial_start: trialData.trial_start,
        trial_end: trialData.trial_end,
        trial_days_remaining: trialData.trial_days_remaining,
      };

      const normalized: SubscriptionData = {
        subscribed: hasPaidSubscription,
        subscription_tier: trialData.subscription_tier,
        subscription_end: null,
        subscription_start: null,
        current_period_start: null,
        current_period_end: null,
        amount: null,
        currency: null,
        status: shouldGrantAccess ? "active" : "inactive",
        cancel_at_period_end: null,
        trial_end: trialData.trial_end,
        trial_start: trialData.trial_start,
        trial_days_remaining: trialData.trial_days_remaining,
        trial_active: trialActive,
        access_level: trialData.access_level as "none" | "trial" | "premium",
        effective_subscription:
          trialData.effective_subscription ?? shouldGrantAccess,
        has_paid_subscription: hasPaidSubscription,
        trial_data: trialDataStructure,
        payment_method: null,
        discount: null,
        last_payment_amount: null,
        last_payment_currency: null,
        last_payment_status: null,
      };

      console.log("✅ [DIRECT] Dados normalizados do banco:", normalized);
      setSubscriptionData(normalized);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      console.error("❌ [DIRECT] Erro na verificação de assinatura:", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, setSubscriptionData]);

  // useEffect para verificar assinatura quando sessão muda
  useEffect(() => {
    console.log("🔄 useSubscriptionDirect useEffect triggered:", {
      sessionUserId: session?.user?.id,
      userEmail: session?.user?.email,
      hasSession: !!session
    });
    
    if (session?.user?.id) {
      console.log("✅ Sessão válida encontrada, chamando checkSubscription");
      checkSubscription();
    } else {
      console.log("⚠️ Nenhuma sessão válida, definindo loading como false");
      setLoading(false);
    }
  }, [session?.user?.id, checkSubscription]);

  return {
    subscriptionData: state.data,
    loading: state.loading,
    error: state.error,
    checkSubscription,
    // Helper functions for trial data
    hasActiveSubscription: state.data.effective_subscription,
    hasActiveTrial: state.data.trial_active,
    hasPaidSubscription: state.data.has_paid_subscription,
    accessLevel: state.data.access_level,
    trialDaysRemaining: state.data.trial_days_remaining,
    // Additional trial helpers
    isTrialExpiring:
      (state.data.trial_days_remaining ?? 0) <= 3 &&
      (state.data.trial_days_remaining ?? 0) > 0,
    isTrialExpired:
      state.data.trial_active === false &&
      state.data.trial_data.trial_end !== null,
    canStartTrial:
      !state.data.has_paid_subscription &&
      state.data.trial_data.trial_start === null,
  };
};
