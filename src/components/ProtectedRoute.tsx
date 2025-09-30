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
    if (trialCheckLoading || trialCheckComplete) return;

    setTrialCheckLoading(true);

    try {
      // Check if user already has a subscriber record
      const { data: existingSubscriber } = await supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (existingSubscriber) {
        setTrialCheckComplete(true);
        return;
      }

      // Check if user is new (created recently)
      const userCreatedAt = new Date(user?.created_at || "");
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      // Only create trial for users created within the last 24 hours
      if (daysDiff > 1) {
        setTrialCheckComplete(true);
        return;
      }

      try {
        // Use the Edge Function to create trial
        const response = await fetch("/functions/v1/start-trial", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na Edge Function start-trial:", errorText);
          throw new Error(`Edge Function error: ${response.status}`);
        }

        const result = await response.json();
        console.log("Resultado da Edge Function:", result);

        if (result.success) {
          toast({
            title: "Bem-vindo ao Meu Dinheiro! 🎉",
            description: "Você ganhou 7 dias grátis para experimentar todas as funcionalidades premium.",
          });
        }
      } catch (error) {
        console.error("Erro na criação automática de trial:", error);
        // Try using the database function as fallback
        try {
          const { data: functionResult, error: functionError } = await supabase
            .rpc('ensure_user_has_trial', { check_user_id: user?.id });

          if (functionError) {
            console.error("Erro na função de criação de trial:", functionError);
          } else if (functionResult) {
            toast({
              title: "Bem-vindo ao Meu Dinheiro! 🎉",
              description: "Você ganhou 7 dias grátis para experimentar todas as funcionalidades premium.",
            });
          }
        } catch (fallbackError) {
          console.error("Erro no fallback de criação de trial:", fallbackError);
        }
      }

      setTrialCheckComplete(true);
    } catch (error) {
      console.error("Erro geral na verificação de trial:", error);
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
