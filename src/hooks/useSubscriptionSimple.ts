import { useState, useEffect } from "react";

export const useSubscriptionSimple = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    status: null,
    trial_end: null,
    trial_start: null,
    trial_days_remaining: null,
    amount: null,
    currency: null,
  });

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
      setSubscriptionData({
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null,
        status: "inactive",
        trial_end: null,
        trial_start: null,
        trial_days_remaining: null,
        amount: null,
        currency: null,
      });
    }, 1000);
  }, []);

  return {
    subscriptionData,
    loading,
    checkSubscription: () => {},
    createCheckout: () => {},
    openCustomerPortal: () => {},
    getPaymentHistory: () => [],
  };
};
