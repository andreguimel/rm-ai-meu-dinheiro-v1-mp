import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trialCheckComplete, setTrialCheckComplete] = useState(false);
  const [trialCheckLoading, setTrialCheckLoading] = useState(false);

  // First-login detection and automatic trial creation
  const checkAndCreateTrialForNewUser = useCallback(async () => {
    if (!user || !session || trialCheckComplete || trialCheckLoading) {
      return;
    }

    try {
      setTrialCheckLoading(true);
      console.log(
        "🆕 ProtectedRoute - Verificando necessidade de trial automático para:",
        user.email
      );

      // Check if user already has subscriber record or trial history
      const { data: existingSubscriber, error: subscriberError } =
        await supabase
          .from("subscribers")
          .select("trial_start, trial_end, subscribed, subscription_tier")
          .eq("user_id", user.id)
          .single();

      if (subscriberError && subscriberError.code !== "PGRST116") {
        console.warn(
          "⚠️ Erro ao verificar subscriber existente:",
          subscriberError
        );
        // Continue without throwing - this is not critical
        setTrialCheckComplete(true);
        return;
      }

      // If user has subscriber record, they're not a new user
      if (existingSubscriber) {
        console.log(
          "ℹ️ Usuário já possui registro de subscriber - não é novo usuário"
        );
        setTrialCheckComplete(true);
        return;
      }

      // User has no subscriber record - they're a new user, create trial
      console.log("🆕 Novo usuário detectado - criando trial automático");

      try {
        // Try direct database function first (more reliable)
        const { data: directTrialResult, error: directTrialError } =
          await supabase.rpc("ensure_user_has_trial", {
            check_user_id: user.id,
          });

        if (directTrialError) {
          console.warn("⚠️ Erro na função direta de trial:", directTrialError);

          // Fallback to Edge Function
          const headers = {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          };

          const { data: trialData, error: trialError } =
            await supabase.functions.invoke("start-trial", { headers });

          if (trialError) {
            console.warn(
              "⚠️ Falha na criação automática de trial (Edge Function):",
              trialError.message
            );
            setTrialCheckComplete(true);
            return;
          }

          if (trialData?.trial_created) {
            console.log("✅ Trial criado automaticamente via Edge Function");
            toast({
              title: "Bem-vindo ao Meu Dinheiro! 🎉",
              description:
                "Você ganhou 7 dias grátis para experimentar todas as funcionalidades premium.",
            });
          }
        } else if (directTrialResult) {
          console.log("✅ Trial criado automaticamente via função direta");
          toast({
            title: "Bem-vindo ao Meu Dinheiro! 🎉",
            description:
              "Você ganhou 7 dias grátis para experimentar todas as funcionalidades premium.",
          });
        } else {
          console.log(
            "ℹ️ Trial não foi criado - usuário pode já ter trial ou não estar confirmado"
          );
        }
      } catch (error) {
        console.warn("⚠️ Erro inesperado na criação de trial:", error);
      }

      setTrialCheckComplete(true);
    } catch (error) {
      console.warn("⚠️ Erro inesperado na criação automática de trial:", error);
      // Don't block user flow for trial creation errors
      setTrialCheckComplete(true);
    } finally {
      setTrialCheckLoading(false);
    }
  }, [user, session, trialCheckComplete, trialCheckLoading, toast]);

  // Check for authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Check and create trial for new users after authentication is confirmed
  useEffect(() => {
    if (!loading && user && session && !trialCheckComplete) {
      // Small delay to ensure user profile creation is complete
      const timer = setTimeout(() => {
        checkAndCreateTrialForNewUser();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    user,
    session,
    loading,
    trialCheckComplete,
    checkAndCreateTrialForNewUser,
  ]);

  // Reset trial check when user changes (for user switching scenarios)
  useEffect(() => {
    if (user?.id) {
      setTrialCheckComplete(false);
      setTrialCheckLoading(false);
    }
  }, [user?.id]);

  // Enhanced loading states during authentication and trial setup
  if (loading || trialCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {loading
                ? "Verificando autenticação..."
                : "Configurando sua conta..."}
            </p>
            {trialCheckLoading && (
              <p className="text-sm text-gray-500 mt-1">
                Preparando seu período de teste gratuito
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
