import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// Função para criar categorias padrão
const createDefaultCategories = async (userId: string) => {
  const categoriasPadrao = [
    // Receitas
    { nome: "Salário", tipo: "receita", cor: "#10B981", icone: "DollarSign" },
    { nome: "Freelance", tipo: "receita", cor: "#3B82F6", icone: "Briefcase" },
    { nome: "Investimentos", tipo: "receita", cor: "#8B5CF6", icone: "TrendingUp" },
    { nome: "Vendas", tipo: "receita", cor: "#F59E0B", icone: "ShoppingBag" },
    { nome: "Aluguel Recebido", tipo: "receita", cor: "#059669", icone: "Home" },
    // Despesas
    { nome: "Alimentação", tipo: "despesa", cor: "#EF4444", icone: "Utensils" },
    { nome: "Transporte", tipo: "despesa", cor: "#F97316", icone: "Car" },
    { nome: "Moradia", tipo: "despesa", cor: "#6366F1", icone: "Home" },
    { nome: "Saúde", tipo: "despesa", cor: "#EC4899", icone: "Heart" },
    { nome: "Educação", tipo: "despesa", cor: "#14B8A6", icone: "BookOpen" },
    { nome: "Lazer", tipo: "despesa", cor: "#8B5CF6", icone: "Gamepad2" },
    { nome: "Roupas", tipo: "despesa", cor: "#F59E0B", icone: "Shirt" },
    { nome: "Tecnologia", tipo: "despesa", cor: "#6B7280", icone: "Smartphone" },
    { nome: "Serviços", tipo: "despesa", cor: "#84CC16", icone: "Settings" },
    { nome: "Serviços de Streaming", tipo: "despesa", cor: "#9333EA", icone: "Film" },
  ];

  for (const categoria of categoriasPadrao) {
    await supabase
      .from('categorias')
      .insert([{
        ...categoria,
        user_id: userId
      }]);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(null);

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

  // Get main account user ID
  const getMainAccountUserId = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_main_account_user_id", {
        user_id: user.id,
      });

      if (error) throw error;
      setMainAccountUserId(data);
    } catch (error) {
      console.error("Erro ao buscar user_id da conta principal:", error);
    }
  }, [user]);

  // Effect to get main account user ID when user changes
  useEffect(() => {
    if (user) {
      getMainAccountUserId();
    } else {
      setMainAccountUserId(null);
    }
  }, [user, getMainAccountUserId]);

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
        console.log("✅ useAuth.signIn - Login bem-sucedido:", JSON.stringify({
          userId: data.user?.id,
          email: data.user?.email,
        }, null, 2));
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
              
              // Criar categorias padrão automaticamente
              try {
                console.log("🔄 Criando categorias padrão automaticamente...");
                await createDefaultCategories(data.user.id);
                console.log("✅ Categorias padrão criadas com sucesso!");
              } catch (categoriesError) {
                console.error("❌ Erro ao criar categorias padrão:", categoriesError);
              }
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

  const ensureUserProfile = useCallback(async () => {
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
  }, [user]);

  return {
    user,
    session,
    loading,
    mainAccountUserId,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    ensureUserProfile,
  };
};
