import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription status when user logs in
      if (session?.user && event === 'SIGNED_IN') {
        setTimeout(async () => {
          try {
            const token = session.access_token;
            if (token) {
              await supabase.functions.invoke('check-subscription', { headers: { Authorization: `Bearer ${token}` } });
            } else {
              await supabase.functions.invoke('check-subscription').catch(console.error);
            }
          } catch (err) {
            console.error(err);
          }
        }, 1000);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription status for existing session
      if (session?.user) {
        setTimeout(async () => {
          try {
            const token = session.access_token;
            if (token) {
              await supabase.functions.invoke('check-subscription', { headers: { Authorization: `Bearer ${token}` } });
            } else {
              await supabase.functions.invoke('check-subscription').catch(console.error);
            }
          } catch (err) {
            console.error(err);
          }
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    organizationName: string,
    telefone: string
  ) => {
    const redirectUrl = `${window.location.origin}/login`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          organization_name: organizationName,
          telefone,
        },
      },
    });

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Cadastro realizado com sucesso!",
      description: "Verifique seu email para confirmar a conta.",
    });

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Login realizado com sucesso!",
      description: "Bem-vindo de volta!",
    });

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/login?type=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Email enviado!",
      description: "Verifique sua caixa de entrada para redefinir sua senha.",
    });

    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};