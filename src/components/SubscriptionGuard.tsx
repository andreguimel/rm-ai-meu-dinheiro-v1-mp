import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscriptionDirect } from "@/hooks/useSubscriptionDirect";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrialExpirationModal } from "@/components/TrialExpirationModal";
import { BasicAccessProvider } from "@/components/BasicAccessProvider";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { subscriptionData, loading } = useSubscriptionDirect();
  const { createCheckout } = useSubscription(); // Apenas para função de checkout
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [showTrialExpirationModal, setShowTrialExpirationModal] =
    useState(false);
  const [modalDismissedThisSession, setModalDismissedThisSession] =
    useState(false);

  // DEBUG: Log estados de loading
  console.log("🔍 SubscriptionGuard DEBUG:", {
    loading,
    adminLoading,
    user: user?.email,
    subscriptionData,
    location: location.pathname
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log("🔍 Verificando status de admin para:", user?.email);
      if (user) {
        try {
          console.log("📞 Chamando supabase.rpc('is_admin')...");
          const { data, error } = await supabase.rpc("is_admin");
          console.log("📊 Resultado is_admin:", { data, error });
          if (!error) {
            setIsAdmin(data || false);
            console.log("✅ Admin status definido:", data || false);
          } else {
            console.error("❌ Erro na função is_admin:", error);
          }
        } catch (error) {
          console.error("❌ Exceção ao verificar admin status:", error);
        }
      } else {
        console.log("⚠️ Usuário não encontrado, pulando verificação de admin");
      }
      console.log("✅ Finalizando verificação de admin, setAdminLoading(false)");
      setAdminLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  // Define basic access pages (read-only access for expired trial users)
  const basicAccessPages = [
    "/dashboard",
    "/receitas",
    "/despesas",
    "/transacoes",
  ];
  const isBasicAccessPage = basicAccessPages.includes(location.pathname);

  // Hierarchical access checking: admin > paid > trial > basic > none
  const accessResult = (() => {
    try {
      // Level 1: Admin users have full access (highest priority)
      if (isAdmin) {
        return { hasAccess: true, accessType: "full" };
      }

      // Level 2: Users with paid subscription (second priority)
      if (subscriptionData.has_paid_subscription) {
        return { hasAccess: true, accessType: "full" };
      }

      // Level 3: Users with active trial (third priority)
      if (subscriptionData.trial_active) {
        return { hasAccess: true, accessType: "full" };
      }

      // Level 4: Basic access for expired trial users on specific pages (fourth priority)
      const hasTrialHistory = subscriptionData.trial_data?.trial_end !== null;
      if (hasTrialHistory && isBasicAccessPage) {
        return { hasAccess: true, accessType: "basic" };
      }

      // Level 5: No access (lowest priority)
      console.log("❌ Acesso negado - Sem assinatura ou trial válido");
      console.log("🔍 Access level:", subscriptionData.access_level);
      console.log("🔍 Effective subscription:", subscriptionData.effective_subscription);
      return { hasAccess: false, accessType: "none" };
    } catch (err) {
      console.error("SubscriptionGuard - Error checking access:", err);
      // On error, deny access for security
      return { hasAccess: false, accessType: "none" };
    }
  })();

  const hasValidAccess = accessResult.hasAccess;
  const accessType = accessResult.accessType;

  // Check for expired trial and show modal
  useEffect(() => {
    if (
      !loading &&
      !adminLoading &&
      !isAdmin &&
      !showTrialExpirationModal &&
      !modalDismissedThisSession
    ) {
      const hasTrialHistory = subscriptionData.trial_data?.trial_end !== null;
      const isTrialExpired =
        hasTrialHistory &&
        !subscriptionData.trial_active &&
        !subscriptionData.has_paid_subscription;

      const isTrialExpiring =
        subscriptionData.trial_active &&
        (subscriptionData.trial_days_remaining ?? 0) <= 1 &&
        (subscriptionData.trial_days_remaining ?? 0) >= 0;

      // Show modal for expired trial or trial expiring in 1 day or less
      // Only show if user has trial history, no paid subscription, and modal wasn't dismissed
      if ((isTrialExpired || isTrialExpiring) && hasTrialHistory) {
        console.log("🚨 Trial expiration detected - showing modal", {
          isTrialExpired,
          isTrialExpiring,
          hasTrialHistory,
          trial_days_remaining: subscriptionData.trial_days_remaining,
          trial_active: subscriptionData.trial_active,
          has_paid_subscription: subscriptionData.has_paid_subscription,
          trial_end: subscriptionData.trial_data?.trial_end,
          modalDismissedThisSession,
        });
        setShowTrialExpirationModal(true);
      }
    }
  }, [
    loading,
    adminLoading,
    isAdmin,
    subscriptionData.trial_active,
    subscriptionData.trial_days_remaining,
    subscriptionData.has_paid_subscription,
    subscriptionData.trial_data?.trial_end,
    showTrialExpirationModal,
    modalDismissedThisSession,
  ]);

  useEffect(() => {
    if (!loading && !adminLoading && !hasValidAccess) {
      // If no valid access and not on profile page, redirect to profile
      if (location.pathname !== "/perfil") {
        console.log("🔄 Redirecionando para perfil - sem acesso válido");
        navigate("/perfil");
      }
    }
  }, [hasValidAccess, loading, adminLoading, location.pathname, navigate]);

  // Enhanced loading states during trial verification
  if (loading || adminLoading) {
    console.log("🔄 Renderizando tela de loading:", { loading, adminLoading });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              Verificando acesso...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {loading && adminLoading
                ? "Verificando assinatura e permissões"
                : loading
                ? "Verificando assinatura e período de teste"
                : "Verificando permissões de administrador"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle upgrade flow from trial expiration modal
  const handleUpgradeFromModal = () => {
    console.log("🚀 Iniciando upgrade a partir do modal de expiração");
    createCheckout();
    setShowTrialExpirationModal(false);

    // Reset session dismissal flag in case user returns after successful payment
    setModalDismissedThisSession(false);
  };

  // Handle modal dismissal
  const handleModalDismiss = (open: boolean) => {
    setShowTrialExpirationModal(open);
    if (!open) {
      // Mark modal as dismissed for this session to prevent repeated showing
      setModalDismissedThisSession(true);
      console.log("📝 Modal de expiração de trial foi dispensado nesta sessão");
    }
  };

  // Determine if trial is expired (not active but has trial_end date)
  const isTrialExpired =
    subscriptionData.trial_data?.trial_end &&
    !subscriptionData.trial_active &&
    !subscriptionData.has_paid_subscription;

  // Block access if no valid access and not on profile page
  if (!hasValidAccess && location.pathname !== "/perfil") {
    console.log("🚫 Bloqueando acesso - redirecionamento necessário");
    return null;
  }

  console.log("✅ Renderizando children - acesso liberado:", { hasValidAccess, accessType });

  return (
    <>
      <BasicAccessProvider
        isBasicAccess={accessType === "basic"}
        onShowUpgradePrompt={() => {
          setModalDismissedThisSession(false);
          setShowTrialExpirationModal(true);
        }}
      >
        {children}
      </BasicAccessProvider>

      {/* Trial Expiration Modal */}
      <TrialExpirationModal
        open={showTrialExpirationModal}
        onOpenChange={handleModalDismiss}
        onUpgrade={handleUpgradeFromModal}
        isExpired={!!isTrialExpired}
        daysRemaining={subscriptionData.trial_days_remaining}
      />
    </>
  );
};
