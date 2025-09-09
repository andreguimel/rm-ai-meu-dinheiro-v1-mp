import React from "react";
import { useSubscriptionDirect } from "@/hooks/useSubscriptionDirect";
import { Badge } from "@/components/ui/badge";

export const AccessStatusIndicator: React.FC = () => {
  const { subscriptionData, loading, hasActiveSubscription, hasActiveTrial } =
    useSubscriptionDirect();

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Badge variant="secondary">Verificando acesso...</Badge>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <Badge
        variant={hasActiveSubscription ? "default" : "destructive"}
        className={hasActiveSubscription ? "bg-green-500" : "bg-red-500"}
      >
        {hasActiveSubscription
          ? hasActiveTrial
            ? `✅ Trial Ativo (${subscriptionData.trial_days_remaining}d)`
            : "✅ Assinatura Paga"
          : "❌ Acesso Bloqueado"}
      </Badge>
    </div>
  );
};
