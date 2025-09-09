import { useSubscriptionDirect } from "@/hooks/useSubscriptionDirect";
import { Badge } from "@/components/ui/badge";
import {
  calculateDaysRemaining,
  formatDaysRemaining,
  getSubscriptionStatus,
  getSubscriptionBadgeVariant,
} from "@/lib/utils";

export function SubscriptionStatus() {
  const { subscriptionData, loading } = useSubscriptionDirect();

  if (loading) {
    return <Badge variant="outline">Carregando...</Badge>;
  }

  if (!subscriptionData?.effective_subscription) {
    return <Badge variant="destructive">Inativo</Badge>;
  }

  // Determinar se está em período de trial
  const isTrialPeriod =
    subscriptionData.subscription_tier === "Trial" ||
    (subscriptionData.trial_end &&
      new Date(subscriptionData.trial_end).getTime() > Date.now());

  const daysRemaining = calculateDaysRemaining(
    isTrialPeriod
      ? subscriptionData.trial_end
      : subscriptionData.current_period_end
  );

  const status = getSubscriptionStatus(
    subscriptionData.effective_subscription,
    isTrialPeriod,
    daysRemaining
  );

  const badgeVariant = getSubscriptionBadgeVariant(status);
  const badgeText = formatDaysRemaining(daysRemaining, isTrialPeriod);

  return <Badge variant={badgeVariant}>{badgeText}</Badge>;
}
