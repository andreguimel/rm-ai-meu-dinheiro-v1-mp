import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { subscriptionData, loading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.rpc("is_admin");
          if (!error) {
            setIsAdmin(data || false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
      setAdminLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  // Check if user has valid subscription
  const isEffectivelySubscribed = (() => {
    try {
      console.log("🛡️ SubscriptionGuard - Verificando acesso");
      console.log("🛡️ isAdmin:", isAdmin);
      console.log("🛡️ subscriptionData:", subscriptionData);

      // Admin users have full access
      if (isAdmin) {
        console.log("✅ Acesso liberado - Usuário é admin");
        return true;
      }

      // Check if user has active subscription (qualquer tier que não seja trial)
      if (subscriptionData.subscribed) {
        console.log("✅ Usuário tem assinatura ativa");
        console.log("🔍 Tier:", subscriptionData.subscription_tier);
        console.log("🔍 Status:", subscriptionData.status);

        // Se não é trial, liberar acesso
        if (subscriptionData.subscription_tier !== "Trial") {
          console.log("✅ Acesso liberado - Assinatura válida");
          return true;
        }
      }

      console.log("❌ Acesso negado - Sem assinatura válida");
      return false;
    } catch (err) {
      console.error("SubscriptionGuard - Error checking subscription:", err);
      return false;
    }
  })();

  useEffect(() => {
    if (!loading && !adminLoading && !isEffectivelySubscribed) {
      // If no valid subscription and not on profile page, redirect to profile
      if (location.pathname !== "/perfil") {
        navigate("/perfil");
      }
    }
  }, [
    isEffectivelySubscribed,
    loading,
    adminLoading,
    location.pathname,
    navigate,
  ]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Block access if no valid subscription and not on profile page
  if (!isEffectivelySubscribed && location.pathname !== "/perfil") {
    return null;
  }

  return <>{children}</>;
};
