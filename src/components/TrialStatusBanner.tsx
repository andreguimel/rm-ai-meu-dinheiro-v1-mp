import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, AlertTriangle, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialStatusBannerProps {
  onUpgrade?: () => void;
  className?: string;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  onUpgrade,
  className,
}) => {
  const { subscriptionData, loading, createCheckout } = useSubscription();

  // Don't show banner if loading or user has paid subscription
  if (loading || subscriptionData.has_paid_subscription) {
    return null;
  }

  // Don't show banner if user doesn't have an active trial
  if (
    !subscriptionData.trial_active ||
    !subscriptionData.trial_data.trial_active
  ) {
    return null;
  }

  const daysRemaining = subscriptionData.trial_days_remaining ?? 0;
  const trialEnd = subscriptionData.trial_data.trial_end;

  // Determine banner color and urgency based on days remaining
  const getBannerVariant = (days: number) => {
    if (days <= 1) return "destructive"; // Red for 1 day or less
    if (days <= 3) return "default"; // Yellow/orange for 2-3 days
    return "default"; // Green for 4+ days
  };

  const getBannerStyles = (days: number) => {
    if (days <= 1) {
      return "border-red-200 bg-red-50 text-red-900";
    }
    if (days <= 3) {
      return "border-yellow-200 bg-yellow-50 text-yellow-900";
    }
    return "border-green-200 bg-green-50 text-green-900";
  };

  const getIconColor = (days: number) => {
    if (days <= 1) return "text-red-600";
    if (days <= 3) return "text-yellow-600";
    return "text-green-600";
  };

  const getIcon = (days: number) => {
    if (days <= 1) return AlertTriangle;
    if (days <= 3) return Calendar;
    return Gift;
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      createCheckout();
    }
  };

  const formatTrialEndDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const Icon = getIcon(daysRemaining);

  return (
    <Alert
      className={cn(
        "mb-6 border-l-4",
        getBannerStyles(daysRemaining),
        className
      )}
    >
      <Icon className={cn("h-4 w-4", getIconColor(daysRemaining))} />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant={getBannerVariant(daysRemaining)}
              className="text-xs"
            >
              Período de Teste
            </Badge>
            <span className="font-semibold">
              {daysRemaining === 1
                ? "Último dia!"
                : daysRemaining === 0
                ? "Teste expirado"
                : `${daysRemaining} dias restantes`}
            </span>
          </div>
          <p className="text-sm opacity-90">
            {daysRemaining > 0 ? (
              <>
                Aproveite todos os recursos premium até{" "}
                {trialEnd && formatTrialEndDate(trialEnd)}.
                {daysRemaining <= 3 && " Não perca o acesso!"}
              </>
            ) : (
              "Seu período de teste expirou. Assine para continuar usando todos os recursos."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className={cn(
              "gap-2 font-medium",
              daysRemaining <= 1
                ? "bg-red-600 hover:bg-red-700 text-white"
                : daysRemaining <= 3
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <Crown className="h-4 w-4" />
            {daysRemaining <= 1 ? "Assinar Agora" : "Fazer Upgrade"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default TrialStatusBanner;
