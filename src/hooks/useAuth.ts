import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 useAuth.signIn - Iniciando login para:", email);

      // Validação prévia
      if (!email || !password) {
        const error = new Error("Email e senha são obrigatórios") as AuthError;
        console.error("❌ useAuth.signIn - Validação falhou:", error.message);
        return { data: null, error };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("❌ useAuth.signIn - Erro do Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      } else {
        console.log("✅ useAuth.signIn - Login bem-sucedido:", {
          userId: data.user?.id,
          email: data.user?.email,
        });
      }

      return { data, error };
    } catch (error) {
      console.error("❌ useAuth.signIn - Erro inesperado:", error);
      return { data: null, error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log("📝 useAuth.signUp - Iniciando registro para:", email);
      console.log("📝 useAuth.signUp - Metadata:", metadata);

      // Validação prévia
      if (!email || !password) {
        const error = new Error("Email e senha são obrigatórios") as AuthError;
        console.error("❌ useAuth.signUp - Validação falhou:", error.message);
        return { data: null, error };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        console.error("❌ useAuth.signUp - Erro do Supabase:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      } else if (data?.user) {
        console.log("✅ useAuth.signUp - Registro bem-sucedido:", {
          userId: data.user?.id,
          email: data.user?.email,
          needsConfirmation: !data.session,
        });

        // Se o usuário foi criado com sucesso, criar perfil e subscriber
        if (data.user && data.session) {
          // Usuário logado automaticamente (sem confirmação de email)
          try {
            console.log("🔄 Criando perfil do usuário automaticamente...");
            const { data: onboardingResult, error: onboardingError } =
              await supabase.rpc("create_user_profile_simple", {
                user_id: data.user.id,
                user_email: data.user.email,
                user_name: metadata?.name || "Usuário",
                organization_name: metadata?.name || "Minha Empresa",
                telefone: metadata?.telefone || "",
              });

            if (onboardingError) {
              console.error("❌ Erro no onboarding:", onboardingError);
            } else {
              console.log("✅ Onboarding concluído:", onboardingResult);
            }
          } catch (onboardingErr) {
            console.error("❌ Erro inesperado no onboarding:", onboardingErr);
          }
        }
      }

      return { data, error };
    } catch (error) {
      console.error("❌ useAuth.signUp - Erro inesperado:", error);
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { data, error };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { data: null, error: error as AuthError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      return { data, error };
    } catch (error) {
      console.error("Error updating password:", error);
      return { data: null, error: error as AuthError };
    }
  };

  const ensureUserProfile = async () => {
    try {
      if (!user) {
        console.log("⚠️ Usuário não logado, não é possível criar perfil");
        return { success: false, message: "Usuário não logado" };
      }

      console.log("🔄 Verificando/criando perfil para:", user.email);

      // Verificar se já existe perfil
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Erro ao verificar perfil existente:", checkError);
        return { success: false, message: checkError.message };
      }

      if (existingProfile) {
        console.log("✅ Perfil já existe");
        return { success: true, data: existingProfile };
      }

      // Criar novo perfil
      console.log("🔄 Criando novo perfil...");
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || "Usuário",
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Erro ao inserir perfil:", insertError);

        // Tentar uma inserção mais básica
        console.log("🔄 Tentando inserção básica...");
        const { data: basicProfile, error: basicError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email,
          })
          .select()
          .single();

        if (basicError) {
          console.error("❌ Erro na inserção básica:", basicError);
          return { success: false, message: basicError.message };
        }

        console.log("✅ Perfil básico criado:", basicProfile);
        return { success: true, data: basicProfile };
      }

      console.log("✅ Perfil criado com sucesso:", newProfile);
      return { success: true, data: newProfile };
    } catch (error) {
      console.error("❌ Erro inesperado ao criar perfil:", error);
      return { success: false, message: "Erro inesperado" };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    ensureUserProfile,
  };
};
