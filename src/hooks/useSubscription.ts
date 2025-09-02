import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
      payment_method: null,
      discount: null,
    },
    loading: true,
    error: null,
  });

  const { toast } = useToast();
  const { user, session } = useAuth();

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

  // Verificar assinatura
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
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
          payment_method: null,
          discount: null,
        });
        return;
      }

      // 2. Verificar assinatura via Edge Function
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription",
        { headers }
      );

      console.log("🔍 Resposta da verificação:", { data, error });

      if (error) {
        console.warn("Erro ao verificar assinatura:", error.message);
        // Se há erro, assumir sem assinatura
        setSubscriptionData({
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
          payment_method: null,
          discount: null,
        });
        return;
      }

      // 3. Normalizar dados da resposta
      const normalized: SubscriptionData = {
        subscribed: data?.subscribed ?? false,
        subscription_tier:
          data?.subscription_tier ?? data?.subscriptionTier ?? null,
        subscription_end:
          data?.subscription_end ?? data?.subscriptionEnd ?? null,
        subscription_start:
          data?.subscription_start ?? data?.subscriptionStart ?? null,
        current_period_start:
          data?.current_period_start ?? data?.currentPeriodStart ?? null,
        current_period_end:
          data?.current_period_end ?? data?.currentPeriodEnd ?? null,
        amount: data?.amount ?? data?.last_payment_amount ?? null,
        currency: data?.currency ?? data?.last_payment_currency ?? null,
        status: data?.status ?? data?.last_payment_status ?? null,
        cancel_at_period_end:
          data?.cancel_at_period_end ?? data?.cancelAtPeriodEnd ?? null,
        trial_end: data?.trial_end ?? data?.trialEnd ?? null,
        trial_start: data?.trial_start ?? data?.trialStart ?? null,
        trial_days_remaining: data?.trial_days_remaining ?? null,
        payment_method: data?.payment_method ?? null,
        discount: data?.discount ?? null,
        last_payment_amount:
          data?.last_payment_amount ?? data?.lastPaymentAmount ?? null,
        last_payment_currency:
          data?.last_payment_currency ?? data?.lastPaymentCurrency ?? null,
        last_payment_status:
          data?.last_payment_status ?? data?.lastPaymentStatus ?? null,
      };

      console.log("✅ Dados normalizados:", normalized);
      console.log(
        "🔍 Status final - subscribed:",
        normalized.subscribed,
        "tier:",
        normalized.subscription_tier
      );

      setSubscriptionData(normalized);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      console.error("Erro na verificação de assinatura:", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, setLoading, setError, setSubscriptionData]);

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
      console.log("📝 Body sendo enviado:", { planId: "monthly" });

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

  // useEffect para verificar assinatura quando sessão muda
  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session, checkSubscription]);

  return {
    subscriptionData: state.data,
    loading: state.loading,
    error: state.error,
    checkSubscription,
    createCheckout,
    forceRefreshSubscription,
  };
};
