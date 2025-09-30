import React, { Suspense } from 'react';
import { RouteWrapper } from './RouteWrapper';

interface LazyRouteProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  requiresAuth?: boolean;
  requiresSubscription?: boolean;
  fallback?: React.ReactNode;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  requiresAuth = true,
  requiresSubscription = true,
  fallback = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
}) => {
  return (
    <RouteWrapper 
      requiresAuth={requiresAuth} 
      requiresSubscription={requiresSubscription}
    >
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </RouteWrapper>
  );
};

export default LazyRoute;