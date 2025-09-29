import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Despesa {
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

export const useDespesas = () => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(
    null
  );

  const fetchDespesas = async () => {
    if (!mainAccountUserId) return;

    try {
      setError(null);
      console.log("📱 useDespesas - Iniciando fetch universal");
      console.log("mainAccountUserId:", mainAccountUserId);

      // Verificar se o usuário está autenticado com fallback
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();
        
        if (authError) {
          console.log("Erro de autenticação, redirecionando para login...");
          await supabase.auth.signOut();
          window.location.reload();
          return;
        }
      } catch (authErr) {
        console.warn('Erro na verificação de autenticação:', authErr);
        // Continuar mesmo com erro de auth para tentar buscar dados
      }

      console.log("Usuário autenticado:", currentUser?.id);

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

      if (despesasError) {
        console.error("Erro ao buscar despesas:", despesasError);
        throw despesasError;
      }
      console.log("Despesas encontradas:", despesasData?.length || 0);
      console.log("Dados das despesas:", despesasData); // Buscar dados da tabela transacoes com tipo despesa
      const { data: transacoesData, error: transacoesError } = await supabase
        .from("transacoes")
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .eq("tipo", "despesa")
        .eq("user_id", mainAccountUserId);

      if (transacoesError) {
        console.error("Erro ao buscar transações:", transacoesError);
        throw transacoesError;
      }
      console.log(
        "Transações de despesa encontradas:",
        transacoesData?.length || 0
      );
      console.log("Dados das transações:", transacoesData);

      // Combinar os dados
      const allDespesas = [...(despesasData || []), ...(transacoesData || [])];
      console.log("Total combinado:", allDespesas.length);

      // Verificar se há despesa de R$ 135
      const despesa135 = allDespesas.find((d) => d.valor === 135);
      console.log("Despesa de R$ 135 encontrada:", despesa135);

      // Ordenar por data de criação (created_at) e depois por data do evento
      const sortedDespesas = allDespesas.sort((a, b) => {
        const dateA = new Date(a.created_at || a.data);
        const dateB = new Date(b.created_at || b.data);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Despesas ordenadas:", sortedDespesas.slice(0, 3)); // Mostrar as 3 primeiras
      console.log("===========================");

      setDespesas(sortedDespesas);
    } catch (error: any) {
      console.error("Erro ao carregar despesas:", error);
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDespesa = async (
    despesa: Omit<
      Despesa,
      "id" | "user_id" | "created_at" | "updated_at" | "categorias"
    > & { categoria_id?: string; tipo?: string }
  ) => {
    console.log("=== DEBUG CREATE DESPESA HOOK ===");
    console.log("mainAccountUserId:", mainAccountUserId);
    console.log("Dados recebidos:", despesa);

    if (!mainAccountUserId) {
      console.log("ERRO: mainAccountUserId não encontrado");
      return { data: null, error: "User ID da conta principal não encontrado" };
    }

    try {
      const dadosParaInserir = {
        ...despesa,
        user_id: mainAccountUserId,
      };

      console.log("Dados para inserir no banco:", dadosParaInserir);

      const { data, error } = await supabase
        .from("despesas")
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
      setDespesas((prev) => [data, ...prev]);

      toast({
        title: "Despesa criada",
        description: "Despesa criada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar despesa",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateDespesa = async (id: string, updates: Partial<Despesa>) => {
    try {
      const { data, error } = await supabase
        .from("despesas")
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
      setDespesas((prev) =>
        prev.map((despesa) => (despesa.id === id ? data : despesa))
      );

      toast({
        title: "Despesa atualizada",
        description: "Despesa atualizada com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar despesa",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteDespesa = async (id: string) => {
    try {
      const { error } = await supabase.from("despesas").delete().eq("id", id);

      if (error) throw error;
      setDespesas((prev) => prev.filter((despesa) => despesa.id !== id));

      toast({
        title: "Despesa removida",
        description: "Despesa removida com sucesso!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover despesa",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteMultipleDespesas = async (ids: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-multiple-transactions",
        {
          body: {
            ids,
            tipo: "despesa",
          },
        }
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setDespesas((prev) =>
        prev.filter((despesa) => !ids.includes(despesa.id))
      );

      toast({
        title: "Despesas removidas",
        description: data.message,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover despesas",
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
      fetchDespesas();

      // Configurar realtime para despesas
      const despesasChannel = supabase
        .channel("despesas_changes")
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
            fetchDespesas();
          }
        )
        .subscribe();

      // Configurar realtime para transacoes de despesa
      const transacoesChannel = supabase
        .channel("transacoes_despesas_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transacoes",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).tipo === "despesa") {
              console.log("Transação despesa alterada, atualizando lista...");
              fetchDespesas();
            }
          }
        )
        .subscribe();

      return () => {
        despesasChannel.unsubscribe();
        transacoesChannel.unsubscribe();
      };
    }
  }, [mainAccountUserId]);

  const getMainAccountUserId = async () => {
    if (!user) return;

    try {
      console.log("=== DEBUG GET MAIN ACCOUNT ===");
      console.log("User atual:", user.id);

      const { data, error } = await supabase.rpc("get_main_account_user_id", {
        user_id: user.id,
      });

      if (error) throw error;
      console.log("Main account user ID:", data);
      console.log("=============================");

      setMainAccountUserId(data);
    } catch (error) {
      console.error("Erro ao buscar user_id da conta principal:", error);
    }
  };

  return {
    despesas,
    loading,
    createDespesa,
    updateDespesa,
    deleteDespesa,
    deleteMultipleDespesas,
    refetch: fetchDespesas,
  };
};
