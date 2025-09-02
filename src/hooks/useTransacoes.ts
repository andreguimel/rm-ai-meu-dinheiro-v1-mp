import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Transacao {
  id: string;
  user_id: string;
  categoria_id?: string;
  created_by_shared_user_id?: string;
  tipo: "receita" | "despesa";
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

export const useTransacoes = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(
    null
  );

  const fetchTransacoes = async () => {
    if (!mainAccountUserId) return;

    try {
      // Buscar dados da tabela transacoes
      const { data: transacoesData, error: transacoesError } = await supabase
        .from("transacoes")
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .eq("user_id", mainAccountUserId);

      if (transacoesError) throw transacoesError;

      // Buscar dados da tabela receitas
      const { data: receitasData, error: receitasError } = await supabase
        .from("receitas")
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .eq("user_id", mainAccountUserId);

      if (receitasError) throw receitasError;

      // Buscar dados da tabela despesas
      const { data: despesasData, error: despesasError } = await supabase
        .from("despesas")
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .eq("user_id", mainAccountUserId);

      if (despesasError) throw despesasError;

      // Combinar todos os dados
      const allTransacoes = [
        ...(transacoesData || []).map((t) => ({ ...t, tipo: t.tipo })),
        ...(receitasData || []).map((r) => ({
          ...r,
          tipo: "receita" as const,
        })),
        ...(despesasData || []).map((d) => ({
          ...d,
          tipo: "despesa" as const,
        })),
      ];

      // Ordenar por data de criação (created_at) e depois por data do evento
      const sortedTransacoes = allTransacoes.sort((a, b) => {
        const dateA = new Date(a.created_at || a.data);
        const dateB = new Date(b.created_at || b.data);
        return dateB.getTime() - dateA.getTime();
      });

      setTransacoes(sortedTransacoes as Transacao[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransacao = async (
    transacao: Omit<
      Transacao,
      "id" | "user_id" | "created_at" | "updated_at" | "categorias"
    >
  ) => {
    if (!mainAccountUserId)
      return { data: null, error: "User ID da conta principal não encontrado" };

    try {
      const { data, error } = await supabase
        .from("transacoes")
        .insert([
          {
            ...transacao,
            user_id: mainAccountUserId,
          },
        ])
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .single();

      if (error) throw error;
      setTransacoes((prev) => [data as Transacao, ...prev]);

      toast({
        title: "Transação criada",
        description: "Transação criada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar transação",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateTransacao = async (id: string, updates: Partial<Transacao>) => {
    try {
      const { data, error } = await supabase
        .from("transacoes")
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
      setTransacoes((prev) =>
        prev.map((transacao) =>
          transacao.id === id ? (data as Transacao) : transacao
        )
      );

      toast({
        title: "Transação atualizada",
        description: "Transação atualizada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteTransacao = async (id: string) => {
    try {
      const { error } = await supabase.from("transacoes").delete().eq("id", id);

      if (error) throw error;
      setTransacoes((prev) => prev.filter((transacao) => transacao.id !== id));

      toast({
        title: "Transação removida",
        description: "Transação removida com sucesso!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover transação",
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
      fetchTransacoes();

      // Configurar realtime para todas as tabelas
      const transacoesChannel = supabase
        .channel("all_transacoes_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transacoes",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          () => {
            console.log("Transação alterada, atualizando lista...");
            fetchTransacoes();
          }
        )
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
            fetchTransacoes();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "despesas",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          () => {
            console.log("Despesa alterada, atualizando lista...");
            fetchTransacoes();
          }
        )
        .subscribe();

      return () => {
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

  // Filtros para compatibilidade
  const receitas = transacoes.filter((t) => t.tipo === "receita");
  const despesas = transacoes.filter((t) => t.tipo === "despesa");

  return {
    transacoes,
    receitas,
    despesas,
    loading,
    createTransacao,
    updateTransacao,
    deleteTransacao,
    refetch: fetchTransacoes,
  };
};
