// Configuração centralizada de planos de assinatura
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: number;
  frequency_type: "months" | "days";
  features: string[];
  popular?: boolean;
  trial_days?: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  monthly: {
    id: "monthly",
    name: "Mensal",
    description: "Plano mensal com todas as funcionalidades",
    amount: 39.9,
    currency: "BRL",
    frequency: 1,
    frequency_type: "months",
    features: [
      "Despesas e Receitas Ilimitadas",
      "WhatsApp Integration",
      "Relatórios",
      "Suporte",
    ],
    trial_days: 7,
  },
  quarterly: {
    id: "quarterly",
    name: "Trimestral",
    description: "Plano trimestral com 15% de desconto",
    amount: 99.9,
    currency: "BRL",
    frequency: 3,
    frequency_type: "months",
    features: [
      "Despesas e Receitas Ilimitadas",
      "WhatsApp Integration",
      "Relatórios",
      "Suporte",
      "15% de Desconto",
    ],
    popular: true,
    trial_days: 7,
  },
  yearly: {
    id: "yearly",
    name: "Anual",
    description: "Plano anual com 25% de desconto",
    amount: 359.9,
    currency: "BRL",
    frequency: 12,
    frequency_type: "months",
    features: [
      "Despesas e Receitas Ilimitadas",
      "WhatsApp Integration",
      "Relatórios",
      "Suporte Prioritário",
      "25% de Desconto",
    ],
    trial_days: 14,
  },
};

export const DEFAULT_PLAN = "monthly";

export const getPlan = (planId: string): SubscriptionPlan | null => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

export const getAllPlans = (): SubscriptionPlan[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

// Métricas de conversão e preços calculados
export const calculateDiscount = (planId: string): number => {
  const plan = getPlan(planId);
  if (!plan) return 0;

  const monthlyPrice = SUBSCRIPTION_PLANS.monthly.amount;
  const planMonthlyEquivalent = plan.amount / plan.frequency;

  return Math.round((1 - planMonthlyEquivalent / monthlyPrice) * 100);
};

export const formatPrice = (
  amount: number,
  currency: string = "BRL"
): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
};
