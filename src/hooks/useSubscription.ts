import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTrialAnalytics } from "@/hooks/useTrialAnalytics";

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
  payment_method?: {
    type: string;
    last4?: string;
    brand?: string;
    exp_month?: number;
    exp_year?: number;
  } | null;
  discount?: {
    coupon: {
      id: string;
      name?: string;
      percent_off?: number;
      amount_off?: number;
    };
    end?: string | null;
  } | null;
  last_payment_amount?: number | null;
  last_payment_currency?: string | null;
  last_payment_status?: string | null;
}

interface SubscriptionState {
  data: SubscriptionData;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
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
  const { logTrialAccessed, logTrialExpired, logTrialError } =
    useTrialAnalytics();

  // Debouncing para evitar requisições excessivas
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Helper para obter headers de autenticação
  const getAuthHeaders = useCallback(async () => {
    const token =
      session?.access_token ??
      (await supabase.auth.getSession()).data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [session]);

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

  // Verificar assinatura com debouncing e otimização
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Debouncing - evitar chamadas muito frequentes
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) { // 1 segundo de debounce
      console.log("🚫 Debouncing: Ignorando chamada muito frequente");
      return;
    }
    lastCheckRef.current = now;

    // Cancelar timeout anterior se existir
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Verificando assinatura para usuário:", user.email);

      // 1. Primeiro verificar se é admin
      const { data: isAdmin, error: adminError } = await supabase.rpc(
        "is_admin"
      );

      if (adminError) {
        console.error("Erro ao verificar admin:", adminError);
      }

      if (isAdmin) {
        console.log("✅ Usuário é admin - definindo acesso completo");
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

      // 2. Fazer chamadas em paralelo para otimizar performance
      const headers = await getAuthHeaders();
      
      const [trialResult, subscriptionResult] = await Promise.all([
        supabase.rpc("get_user_access_status", {
          check_user_id: user.id,
        }),
        supabase.functions.invoke("check-subscription-with-trial", { headers })
      ]);

      console.log("🔍 Resultados paralelos:", {
        trial: trialResult,
        subscription: subscriptionResult,
      });

      // 3. Usar dados diretos do banco quando disponíveis
      let finalData = subscriptionResult.data;
      if (trialResult.data && trialResult.data[0]) {
        const trialData = trialResult.data[0];
        console.log("🎯 PRIORIZANDO dados do trial do banco:", trialData);

        finalData = {
          ...subscriptionResult.data,
          trial_active: trialData.trial_active,
          trial_start: trialData.trial_start,
          trial_end: trialData.trial_end,
          trial_days_remaining: trialData.trial_days_remaining,
          access_level: trialData.access_level,
          effective_subscription: trialData.effective_subscription,
          has_paid_subscription: trialData.has_paid_subscription,
          subscription_tier: trialData.subscription_tier,
        };
      }

      console.log("🔍 Dados finais após correção:", finalData);

      if (subscriptionResult.error) {
        console.warn("Erro ao verificar assinatura:", subscriptionResult.error.message);

        // Enhanced error handling for trial-related failures
        const isTrialError =
          subscriptionResult.error.message?.toLowerCase().includes("trial") ||
          subscriptionResult.error.message?.toLowerCase().includes("teste") ||
          subscriptionResult.error.message?.toLowerCase().includes("período") ||
          subscriptionResult.error.message?.toLowerCase().includes("periodo");

        if (isTrialError) {
          console.warn("⚠️ Erro relacionado a trial detectado");
          setError(`Erro ao verificar período de teste: ${subscriptionResult.error.message}`);

          // Show user-friendly toast for trial verification errors
          toast({
            title: "Erro no período de teste",
            description:
              "Não foi possível verificar seu período de teste. Algumas funcionalidades podem estar limitadas.",
            variant: "destructive",
          });
        } else {
          setError(`Erro ao verificar assinatura: ${subscriptionResult.error.message}`);
        }

        // Se há erro, assumir sem assinatura mas manter estrutura de trial
        const fallbackData: SubscriptionData = {
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
          // Enhanced trial fields with safe defaults
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
        };

        setSubscriptionData(fallbackData);
        return;
      }

      // 5. Normalizar dados da resposta com NOVA LÓGICA: Trial ativo = acesso liberado
      const trialActive = finalData?.trial_active ?? false;
      const hasPaidSubscription =
        finalData?.has_paid_subscription ?? finalData?.subscribed ?? false;

      // NOVA LÓGICA: Se trial está ativo, liberar acesso independente do MercadoPago
      // Se trial expirou, só liberar se houver pagamento confirmado
      const shouldGrantAccess = trialActive || hasPaidSubscription;

      // Calculate access level with NEW hierarchy: trial active = access granted
      const accessLevel: "none" | "trial" | "premium" = shouldGrantAccess
        ? trialActive
          ? "trial" // Trial ativo sempre tem prioridade
          : "premium" // Só premium se não há trial ativo mas há pagamento
        : "none"; // Sem acesso se trial expirou e sem pagamento

      // Calculate effective subscription: PRIORIZA TRIAL ATIVO
      const effectiveSubscription = shouldGrantAccess;

      console.log("🎯 NOVA LÓGICA DE ACESSO:", {
        trialActive,
        hasPaidSubscription,
        shouldGrantAccess,
        accessLevel,
        effectiveSubscription,
        logic: trialActive
          ? "✅ TRIAL ATIVO - Acesso liberado independente do MercadoPago"
          : hasPaidSubscription
          ? "✅ PAGAMENTO CONFIRMADO - Acesso liberado"
          : "❌ ACESSO BLOQUEADO - Trial expirado e sem pagamento",
        rawTrialData: {
          trial_active: finalData?.trial_active,
          trial_start: finalData?.trial_start,
          trial_end: finalData?.trial_end,
          trial_days_remaining: finalData?.trial_days_remaining,
        },
      });

      // Create validated trial data structure
      const trialData: TrialData = {
        trial_active: trialActive,
        trial_start: finalData?.trial_start ?? finalData?.trialStart ?? null,
        trial_end: finalData?.trial_end ?? finalData?.trialEnd ?? null,
        trial_days_remaining: finalData?.trial_days_remaining ?? null,
      };

      // Validate trial data consistency
      if (trialData.trial_active && !trialData.trial_end) {
        console.warn(
          "⚠️ Inconsistent trial data: active trial without end date"
        );
      }

      if (
        trialData.trial_days_remaining !== null &&
        trialData.trial_days_remaining < 0
      ) {
        console.warn(
          "⚠️ Negative trial days remaining detected:",
          trialData.trial_days_remaining
        );
        trialData.trial_days_remaining = 0;
      }

      const normalized: SubscriptionData = {
        subscribed: hasPaidSubscription,
        subscription_tier:
          finalData?.subscription_tier ?? finalData?.subscriptionTier ?? null,
        subscription_end:
          finalData?.subscription_end ?? finalData?.subscriptionEnd ?? null,
        subscription_start:
          finalData?.subscription_start ?? finalData?.subscriptionStart ?? null,
        current_period_start:
          finalData?.current_period_start ??
          finalData?.currentPeriodStart ??
          null,
        current_period_end:
          finalData?.current_period_end ?? finalData?.currentPeriodEnd ?? null,
        amount: finalData?.amount ?? finalData?.last_payment_amount ?? null,
        currency:
          finalData?.currency ?? finalData?.last_payment_currency ?? null,
        status: finalData?.status ?? finalData?.last_payment_status ?? null,
        cancel_at_period_end:
          finalData?.cancel_at_period_end ??
          finalData?.cancelAtPeriodEnd ??
          null,
        trial_end: trialData.trial_end,
        trial_start: trialData.trial_start,
        trial_days_remaining: trialData.trial_days_remaining,
        // Enhanced trial fields
        trial_active: trialActive,
        access_level: accessLevel as "none" | "trial" | "premium",
        effective_subscription: effectiveSubscription,
        has_paid_subscription: hasPaidSubscription,
        trial_data: trialData,
        payment_method: finalData?.payment_method ?? null,
        discount: finalData?.discount ?? null,
        last_payment_amount:
          finalData?.last_payment_amount ??
          finalData?.lastPaymentAmount ??
          null,
        last_payment_currency:
          finalData?.last_payment_currency ??
          finalData?.lastPaymentCurrency ??
          null,
        last_payment_status:
          finalData?.last_payment_status ??
          finalData?.lastPaymentStatus ??
          null,
      };

      console.log("✅ Dados normalizados:", normalized);
      console.log(
        "🔍 Status final - subscribed:",
        normalized.subscribed,
        "effective_subscription:",
        normalized.effective_subscription,
        "access_level:",
        normalized.access_level,
        "trial_active:",
        normalized.trial_active
      );

      // Note: Automatic trial creation is now handled by ProtectedRoute component
      // This ensures trials are created at the right time in the user flow

      // Log trial analytics if trial is active
      if (normalized.trial_active && normalized.trial_days_remaining !== null) {
        logTrialAccessed({
          trial_days_remaining: normalized.trial_days_remaining,
          access_level: normalized.access_level,
          subscription_tier: normalized.subscription_tier,
          request_source: "useSubscription_hook",
        }).catch((error) => {
          console.warn("Failed to log trial access analytics:", error);
        });
      }

      // Log trial expiration if trial just expired
      if (normalized.trial_data.trial_end && !normalized.trial_active) {
        const trialEndDate = new Date(normalized.trial_data.trial_end);
        const now = new Date();
        const timeDiff = now.getTime() - trialEndDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        // Log if trial expired within the last day (to avoid duplicate logs)
        if (daysDiff <= 1 && daysDiff >= 0) {
          logTrialExpired({
            trial_end: normalized.trial_data.trial_end,
            has_paid_subscription: normalized.has_paid_subscription,
            access_level: normalized.access_level,
            request_source: "useSubscription_hook",
          }).catch((error) => {
            console.warn("Failed to log trial expiration analytics:", error);
          });
        }
      }

      setSubscriptionData(normalized);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      console.error("Erro na verificação de assinatura:", error);

      // Enhanced error handling for trial-related failures
      const isTrialError =
        errorMessage?.toLowerCase().includes("trial") ||
        errorMessage?.toLowerCase().includes("teste");

      if (isTrialError) {
        console.error("❌ Erro crítico relacionado a trial:", error);
        setError(`Erro no sistema de período de teste: ${errorMessage}`);

        // Log trial error for analytics
        logTrialError({
          error_type: "subscription_check_error",
          error_message: errorMessage,
          request_source: "useSubscription_hook",
        }).catch((analyticsError) => {
          console.warn("Failed to log trial error analytics:", analyticsError);
        });

        // Show user-friendly toast for trial errors
        toast({
          title: "Erro no período de teste",
          description:
            "Houve um problema ao verificar seu período de teste. Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, setLoading, setError, setSubscriptionData, logTrialAccessed, logTrialExpired, logTrialError, toast]);

  // Criar checkout
  const createCheckout = useCallback(async () => {
    console.log("🛒 createCheckout chamado");

    if (!user) {
      console.log("❌ Usuário não logado");
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar.",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Usuário logado:", user.email);

    try {
      setLoading(true);
      console.log("🔄 Definindo loading como true");

      const headers = await getAuthHeaders();
      console.log("🔑 Headers obtidos:", !!headers.Authorization);

      if (!headers.Authorization) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      console.log("🚀 Chamando Edge Function simple-checkout (TOKEN VÁLIDO!)");
      console.log("📝 Body sendo enviado:", JSON.stringify({ planId: "monthly" }, null, 2));

      const { data, error } = await supabase.functions.invoke(
        "simple-checkout",
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: { planId: "monthly" },
        }
      );

      console.log("📊 Resposta da Edge Function:");
      console.log("  - Data:", data);
      console.log("  - Error:", error);

      if (error) {
        console.error("❌ Erro na Edge Function:", error);
        throw new Error(
          `Erro ao criar checkout: ${error.message || JSON.stringify(error)}`
        );
      }

      if (!data) {
        console.error("❌ Resposta vazia do servidor");
        throw new Error("Resposta vazia do servidor de checkout");
      }

      console.log("🔍 Validando dados retornados:", data);

      if (
        data?.url &&
        typeof data.url === "string" &&
        data.url.startsWith("http")
      ) {
        console.log("✅ URL válida encontrada:", data.url);
        console.log("🌐 Tentando abrir janela...");

        const newWindow = window.open(
          data.url,
          "_blank",
          "noopener,noreferrer"
        );
        console.log("🪟 Janela criada:", !!newWindow);

        if (!newWindow) {
          console.error("❌ Popup bloqueado");
          toast({
            title: "Popup bloqueado",
            description: "Permita popups para este site e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        console.log("✅ Checkout aberto com sucesso!");
        toast({
          title: "Checkout criado",
          description:
            "Você foi redirecionado para o pagamento em uma nova aba.",
        });
      } else {
        console.error("❌ URL inválida ou ausente:", data);
        throw new Error("URL de checkout inválida retornada pelo servidor");
      }
    } catch (error) {
      let errorMessage = "Erro inesperado ao criar checkout";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      console.error("❌ Erro completo:", error);

      toast({
        title: "Erro ao criar checkout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, setLoading, toast]);

  // Forçar refresh da assinatura
  const forceRefreshSubscription = useCallback(async () => {
    console.log("🔄 FORÇANDO REFRESH COMPLETO DA ASSINATURA");
    await checkSubscription();
  }, [checkSubscription]);

  // Cancelar assinatura
  const cancelSubscription = useCallback(async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para cancelar a assinatura.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      setLoading(true);

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      console.log("🚫 Cancelando assinatura...");

      const { data, error } = await supabase.functions.invoke(
        "cancel-mercadopago-subscription",
        { headers }
      );

      if (error) {
        console.error("❌ Erro ao cancelar:", error);
        throw new Error(error.message || "Erro ao cancelar assinatura");
      }

      console.log("✅ Cancelamento realizado:", data);

      toast({
        title: "Assinatura Cancelada",
        description:
          data?.message ||
          "Sua assinatura foi cancelada com sucesso. Você manterá acesso até o fim do período atual.",
      });

      // Atualizar dados da assinatura
      await checkSubscription();

      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao cancelar assinatura";
      console.error("❌ Erro no cancelamento:", error);

      toast({
        title: "Erro ao cancelar",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, setLoading, toast]);

  // useEffect para verificar assinatura quando sessão muda (com debounce)
  useEffect(() => {
    if (session && user) {
      // Debounce o useEffect também
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        checkSubscription();
      }, 500); // 500ms de debounce para useEffect
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [session?.access_token, user?.id, checkSubscription]);

  // Função para iniciar trial manualmente
  const startTrial = useCallback(async () => {
    if (!user) {
      toast({
        title: "Erro",
        description:
          "Você precisa estar logado para iniciar o período de teste.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      setLoading(true);
      console.log("🚀 Iniciando trial manualmente para:", user.email);

      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("start-trial", {
        headers,
      });

      if (error) {
        console.error("❌ Erro ao iniciar trial:", error);
        throw new Error(error.message || "Erro ao iniciar período de teste");
      }

      console.log("✅ Resposta do start-trial:", data);

      if (data?.trial_created) {
        toast({
          title: "Período de teste iniciado!",
          description:
            "Você ganhou 7 dias grátis para experimentar todas as funcionalidades.",
        });

        // Atualizar dados da assinatura
        await checkSubscription();
        return { success: true, data };
      } else if (data?.trial_already_exists) {
        toast({
          title: "Período de teste já existe",
          description: data.message || "Você já possui um período de teste.",
          variant: "destructive",
        });
        return { success: false, error: "Trial já existe" };
      } else {
        throw new Error(
          data?.message || "Não foi possível iniciar o período de teste"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar período de teste";
      console.error("❌ Erro ao iniciar trial:", error);

      toast({
        title: "Erro ao iniciar período de teste",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, setLoading, toast, checkSubscription]);

  return {
    subscriptionData: state.data,
    loading: state.loading,
    error: state.error,
    checkSubscription,
    createCheckout,
    forceRefreshSubscription,
    cancelSubscription,
    startTrial,
    // Helper functions for trial data - enhanced with better defaults and validation
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
