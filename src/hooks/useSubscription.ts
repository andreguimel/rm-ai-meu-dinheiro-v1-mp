import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  // Último pagamento (facilitador para a UI)
  last_payment_amount?: number | null;
  last_payment_currency?: string | null;
  last_payment_status?: string | null;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
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
    payment_method: null,
    discount: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();

  // Helper to build Authorization headers for supabase functions
  const getAuthHeaders = async () => {
    // Prefer session from hook, fallback to client
    const token = session?.access_token ?? (await supabase.auth.getSession()).data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Primeiro verificar se o usuário é admin
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin');
      
      if (adminError) {
        console.error('Error checking admin status:', adminError);
      }

      // Se for admin, considerar como subscribed
      if (isAdmin) {
        setSubscriptionData({
          subscribed: true,
          subscription_tier: 'admin',
          status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: null,
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          amount: null,
          currency: null,
          cancel_at_period_end: false,
          trial_end: null,
          payment_method: null,
          discount: null,
        });
        setLoading(false);
        return;
      }

  const headers = await getAuthHeaders();
  const { data, error } = await supabase.functions.invoke('create-mercadopago-subscription', { headers });

      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Erro ao verificar assinatura",
          description: "Não foi possível verificar o status da assinatura.",
          variant: "destructive",
        });
        return;
      }

      // Normalizar payload recebido do backend (MercadoPago + supabase function)
      const normalized: SubscriptionData = {
        subscribed: data?.subscribed ?? false,
        subscription_tier: data?.subscription_tier ?? data?.subscriptionTier ?? null,
        subscription_end: data?.subscription_end ?? data?.subscriptionEnd ?? null,
        subscription_start: data?.subscription_start ?? data?.subscriptionStart ?? null,
        current_period_start: data?.current_period_start ?? data?.currentPeriodStart ?? null,
        current_period_end: data?.current_period_end ?? data?.currentPeriodEnd ?? data?.subscription_end ?? data?.subscriptionEnd ?? null,
        amount: data?.amount ?? data?.last_payment_amount ?? null,
        currency: data?.currency ?? data?.last_payment_currency ?? null,
        status: data?.status ?? data?.last_payment_status ?? null,
        cancel_at_period_end: data?.cancel_at_period_end ?? data?.cancelAtPeriodEnd ?? null,
        trial_end: data?.trial_end ?? data?.trialEnd ?? null,
        payment_method: data?.payment_method ?? (data?.payment_method_type ? {
          type: data.payment_method_type,
          last4: data.payment_method_last4 ?? data.payment_method_last_four ?? undefined,
          brand: data.payment_method_brand ?? undefined,
          exp_month: data.payment_method_exp_month ?? undefined,
          exp_year: data.payment_method_exp_year ?? undefined,
        } : null),
        discount: data?.discount ?? null,
        last_payment_amount: data?.last_payment_amount ?? data?.lastPaymentAmount ?? null,
        last_payment_currency: data?.last_payment_currency ?? data?.lastPaymentCurrency ?? null,
        last_payment_status: data?.last_payment_status ?? data?.lastPaymentStatus ?? null,
      };

      setSubscriptionData(normalized);
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao verificar assinatura.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar.",
        variant: "destructive",
      });
      return;
    }

    try {
        const headers = await getAuthHeaders();
        const { data, error } = await supabase.functions.invoke('check-mercadopago-subscription', { headers });

      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Erro ao verificar assinatura",
          description: "N\u00e3o foi poss\u00edvel verificar o status da assinatura.",
          variant: "destructive",
        });
        return;
      }

      // Normalizar payload recebido do backend (MercadoPago + supabase function)
      // O backend pode retornar `subscription_end` em vez de `current_period_end`,
      // e campos de payment_method podem vir separados (payment_method_type, etc.).
      const normalized: SubscriptionData = {
        subscribed: data?.subscribed ?? false,
        subscription_tier: data?.subscription_tier ?? data?.subscriptionTier ?? null,
        subscription_end: data?.subscription_end ?? data?.subscriptionEnd ?? null,
        subscription_start: data?.subscription_start ?? data?.subscriptionStart ?? null,
        // Mapear current_period_end para o campo usado pela UI
        current_period_start: data?.current_period_start ?? data?.current_periodStart ?? null,
        current_period_end: data?.current_period_end ?? data?.currentPeriodEnd ?? data?.subscription_end ?? data?.subscriptionEnd ?? null,
        amount: data?.amount ?? null,
        currency: data?.currency ?? null,
        status: data?.status ?? null,
        cancel_at_period_end: data?.cancel_at_period_end ?? data?.cancelAtPeriodEnd ?? null,
        trial_end: data?.trial_end ?? data?.trialEnd ?? data?.trial_end ?? null,
        // Reconstruir payment_method se necessário
        payment_method: data?.payment_method ?? (data?.payment_method_type ? {
          type: data.payment_method_type,
          last4: data.payment_method_last4 ?? data.payment_method_last_four ?? undefined,
          brand: data.payment_method_brand ?? undefined,
          exp_month: data.payment_method_exp_month ?? undefined,
          exp_year: data.payment_method_exp_year ?? undefined,
        } : null),
        discount: data?.discount ?? null,
      };

      // Incluir dados do \"ultimo pagamento\" padronizados (usados como fallback)
      // Campos mantidos com nomes originais para compatibilidade com o front-end
      (normalized as any).last_payment_amount = data?.last_payment_amount ?? data?.lastPaymentAmount ?? null;
      (normalized as any).last_payment_currency = data?.last_payment_currency ?? data?.lastPaymentCurrency ?? null;
      (normalized as any).last_payment_status = data?.last_payment_status ?? data?.lastPaymentStatus ?? null;

  setSubscriptionData(normalized);
  if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error in createCheckout:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar checkout.",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerenciar assinatura.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For MercadoPago, we handle cancellation directly
      const shouldCancel = confirm('Deseja cancelar sua assinatura? Esta ação não pode ser desfeita.');
      if (!shouldCancel) return;

        const headers = await getAuthHeaders();
        const { data, error } = await supabase.functions.invoke('manage-mercadopago-subscription', {
          body: { action: 'cancel' },
          headers,
        });
      
      if (error) {
        console.error('Error canceling subscription:', error);
        toast({
          title: "Erro ao cancelar assinatura",
          description: "Não foi possível cancelar a assinatura.",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Assinatura cancelada",
          description: data.message || "Sua assinatura foi cancelada com sucesso.",
        });
        // Refresh subscription status
        await checkSubscription();
      }
    } catch (error) {
      console.error('Error in openCustomerPortal:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao gerenciar assinatura.",
        variant: "destructive",
      });
    }
  };

  const getPaymentHistory = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para acessar o histórico.",
        variant: "destructive",
      });
      return [];
    }

    try {
        const headers = await getAuthHeaders();
        const { data, error } = await supabase.functions.invoke('mercadopago-payment-history', { headers });
      
      if (error) {
        console.error('Error fetching payment history:', error);
        toast({
          title: "Erro ao buscar histórico",
          description: "Não foi possível buscar o histórico de pagamentos.",
          variant: "destructive",
        });
        return [];
      }

      return data.payments || [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao buscar histórico.",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    // Wait for a valid session to be present to ensure access_token is available
    if (session) {
      checkSubscription();
    }
  }, [session]);

  return {
    subscriptionData,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getPaymentHistory,
  };
};