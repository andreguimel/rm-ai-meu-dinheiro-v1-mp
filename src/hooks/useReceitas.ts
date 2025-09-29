import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Receita {
  id: string;
  user_id: string;
  categoria_id?: string;
  created_by_shared_user_id?: string;
  descricao: string;
  valor: number;
  data: string;
  created_at: string;
  updated_at: string;
  categorias?: {
    nome: string;
    cor: string;
    icone: string;
  };
}

export const useReceitas = () => {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(
    null
  );

  const fetchReceitas = async () => {
    if (!mainAccountUserId) return;

    try {
      setError(null);
      console.log('📱 useReceitas - Iniciando fetch universal');

      // Buscar dados da tabela receitas com fallback robusto
      let receitasData = [];
      let transacoesData = [];

      try {
        const { data, error: receitasError } = await supabase
          .from("receitas")
          .select(`
            *,
            categorias (nome, cor, icone)
          `)
          .eq("user_id", mainAccountUserId)
          .order("data", { ascending: false });

        if (receitasError) {
          console.warn('Erro ao buscar receitas, tentando sem categorias:', receitasError);
          // Fallback: buscar sem categorias
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("receitas")
            .select("*")
            .eq("user_id", mainAccountUserId)
            .order("data", { ascending: false });
          
          if (fallbackError) throw fallbackError;
          receitasData = fallbackData || [];
        } else {
          receitasData = data || [];
        }
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
        receitasData = [];
      }

      // Buscar dados da tabela transacoes com tipo receita
      try {
        const { data, error: transacoesError } = await supabase
          .from("transacoes")
          .select(`
            *,
            categorias (nome, cor, icone)
          `)
          .eq("tipo", "receita")
          .eq("user_id", mainAccountUserId)
          .order("data", { ascending: false });

        if (transacoesError) {
          console.warn('Erro ao buscar transações de receita, tentando sem categorias:', transacoesError);
          // Fallback: buscar sem categorias
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("transacoes")
            .select("*")
            .eq("tipo", "receita")
            .eq("user_id", mainAccountUserId)
            .order("data", { ascending: false });
          
          if (fallbackError) throw fallbackError;
          transacoesData = fallbackData || [];
        } else {
          transacoesData = data || [];
        }
      } catch (err) {
        console.error('Erro ao buscar transações de receita:', err);
        transacoesData = [];
      }

      // Combinar os dados
      const allReceitas = [...(receitasData || []), ...(transacoesData || [])];

      // Ordenar por data de criação (created_at) e depois por data do evento
      const sortedReceitas = allReceitas.sort((a, b) => {
        const dateA = new Date(a.created_at || a.data);
        const dateB = new Date(b.created_at || b.data);
        return dateB.getTime() - dateA.getTime();
      });

      setReceitas(sortedReceitas);
      console.log('📱 useReceitas - Dados carregados com sucesso:', sortedReceitas.length);
      
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erro ao carregar receitas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReceita = async (
    receita: Omit<
      Receita,
      "id" | "user_id" | "created_at" | "updated_at" | "categorias"
    >
  ) => {
    console.log("=== DEBUG CREATE RECEITA HOOK ===");
    console.log("mainAccountUserId:", mainAccountUserId);
    console.log("Dados recebidos:", receita);

    if (!mainAccountUserId) {
      console.log("ERRO: mainAccountUserId não encontrado");
      return { data: null, error: "User ID da conta principal não encontrado" };
    }

    try {
      const dadosParaInserir = {
        ...receita,
        user_id: mainAccountUserId,
      };

      console.log("Dados para inserir no banco:", dadosParaInserir);

      const { data, error } = await supabase
        .from("receitas")
        .insert([dadosParaInserir])
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .single();

      console.log("Resultado da inserção:", JSON.stringify({ data, error }, null, 2));
      console.log("===============================");

      if (error) throw error;
      setReceitas((prev) => [data, ...prev]);

      toast({
        title: "Receita criada",
        description: "Receita criada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar receita",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateReceita = async (id: string, updates: Partial<Receita>) => {
    try {
      const { data, error } = await supabase
        .from("receitas")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .single();

      if (error) throw error;
      setReceitas((prev) =>
        prev.map((receita) => (receita.id === id ? data : receita))
      );

      toast({
        title: "Receita atualizada",
        description: "Receita atualizada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar receita",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteReceita = async (id: string) => {
    try {
      const { error } = await supabase.from("receitas").delete().eq("id", id);

      if (error) throw error;
      setReceitas((prev) => prev.filter((receita) => receita.id !== id));

      toast({
        title: "Receita removida",
        description: "Receita removida com sucesso!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover receita",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteMultipleReceitas = async (ids: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-multiple-transactions",
        {
          body: {
            ids,
            tipo: "receita",
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setReceitas((prev) =>
        prev.filter((receita) => !ids.includes(receita.id))
      );

      toast({
        title: "Receitas removidas",
        description: data.message,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover receitas",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    if (user) {
      getMainAccountUserId();
    }
  }, [user]);

  useEffect(() => {
    if (mainAccountUserId) {
      fetchReceitas();

      // Configurar realtime para receitas
      const receitasChannel = supabase
        .channel("receitas_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "receitas",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          () => {
            console.log("Receita alterada, atualizando lista...");
            fetchReceitas();
          }
        )
        .subscribe();

      // Configurar realtime para transacoes de receita
      const transacoesChannel = supabase
        .channel("transacoes_receitas_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transacoes",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).tipo === "receita") {
              console.log("Transação receita alterada, atualizando lista...");
              fetchReceitas();
            }
          }
        )
        .subscribe();

      return () => {
        receitasChannel.unsubscribe();
        transacoesChannel.unsubscribe();
      };
    }
  }, [mainAccountUserId]);

  const getMainAccountUserId = async () => {
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
  };

  return {
    receitas,
    loading,
    createReceita,
    updateReceita,
    deleteReceita,
    deleteMultipleReceitas,
    refetch: fetchReceitas,
  };
};
