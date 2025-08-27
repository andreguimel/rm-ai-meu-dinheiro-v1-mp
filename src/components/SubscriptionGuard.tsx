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
          const { data, error } = await supabase.rpc('is_admin');
          if (!error) {
            setIsAdmin(data || false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
      setAdminLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  // Considera trial ativo: assinado se `subscribed === true` ou `trial_end` no futuro
  const isEffectivelySubscribed = (() => {
    try {
      if (subscriptionData.subscribed) return true;
      if (subscriptionData.trial_end) {
        const t = new Date(subscriptionData.trial_end);
        return t.getTime() > Date.now();
      }
      return false;
    } catch (err) {
      return false;
    }
  })();

  useEffect(() => {
    if (!loading && !adminLoading && !isEffectivelySubscribed && !isAdmin) {
      // Se não tem assinatura ativa (nem trial válido), não é admin e não está no perfil, redireciona para o perfil
      if (location.pathname !== "/perfil") {
        navigate("/perfil");
      }
    }
  }, [isEffectivelySubscribed, loading, adminLoading, isAdmin, location.pathname, navigate]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Se não tem assinatura efetiva (assinatura ativa ou trial não expirado), não é admin e não está no perfil, não renderiza o conteúdo
  if (!isEffectivelySubscribed && !isAdmin && location.pathname !== "/perfil") {
    return null;
  }

  return <>{children}</>;
};