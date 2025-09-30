import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { SubscriptionGuard } from './SubscriptionGuard';

interface RouteWrapperProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
}

export const RouteWrapper: React.FC<RouteWrapperProps> = ({
  children,
  requiresAuth = true,
  requiresSubscription = true,
}) => {
  // Se não requer autenticação, renderiza diretamente
  if (!requiresAuth) {
    return <>{children}</>;
  }

  // Se requer autenticação mas não assinatura
  if (requiresAuth && !requiresSubscription) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  // Se requer tanto autenticação quanto assinatura
  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        {children}
      </SubscriptionGuard>
    </ProtectedRoute>
  );
};

export default RouteWrapper;