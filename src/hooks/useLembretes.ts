import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Lembrete {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  data_lembrete: string;
  categoria_id?: string;
  concluido: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovoLembrete {
  titulo: string;
  descricao?: string;
  data_lembrete: string;
  categoria_id?: string;
  concluido?: boolean;
}

export const useLembretes = () => {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLembretes = async () => {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLembretes([]);
        return;
      }

      const { data, error } = await supabase
        .from("lembretes")
        .select(`
          *,
          categorias (
            id,
            nome,
            cor
          )
        `)
        .eq("user_id", user.id)
        .order("data_lembrete", { ascending: true });

      if (error) throw error;
      setLembretes((data || []) as Lembrete[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar lembretes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLembrete = async (novoLembrete: NovoLembrete) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("Status de autenticação:", { 
        user: user?.id, 
        email: user?.email,
        authError: authError?.message 
      });
      
      if (!user) {
        throw new Error("Usuário não autenticado. Faça login para criar lembretes.");
      }

      // Preparar dados para inserção
      const dadosParaInserir = {
        titulo: novoLembrete.titulo,
        descricao: novoLembrete.descricao || null,
        data_lembrete: novoLembrete.data_lembrete,
        categoria_id: novoLembrete.categoria_id === "" || !novoLembrete.categoria_id ? null : novoLembrete.categoria_id,
        concluido: novoLembrete.concluido || false,
        user_id: user.id
      };

      console.log("Dados preparados para inserção:", dadosParaInserir);

      const { data, error } = await supabase
        .from('lembretes')
        .insert([dadosParaInserir])
        .select(`
          *,
          categorias (
            id,
            nome,
            cor
          )
        `)
        .single();

      console.log("Resposta do Supabase:", { data, error });

      if (error) {
        console.error("Erro detalhado do Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      setLembretes(prev => [...prev, data]);
      
      toast({
        title: "Lembrete criado com sucesso!",
        description: `O lembrete "${novoLembrete.titulo}" foi adicionado.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar lembrete",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLembrete = async (id: string, updates: Partial<Lembrete>) => {
    try {
      const { data, error } = await supabase
        .from("lembretes")
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
      setLembretes((prev) =>
        prev.map((lembrete) => (lembrete.id === id ? (data as Lembrete) : lembrete))
      );

      toast({
        title: "Lembrete atualizado",
        description: "Lembrete atualizado com sucesso!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const marcarComoConcluido = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("lembretes")
        .update({ concluido: true })
        .eq("id", id)
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .single();

      if (error) throw error;
      setLembretes((prev) =>
        prev.map((lembrete) => (lembrete.id === id ? (data as Lembrete) : lembrete))
      );

      toast({
        title: "Lembrete concluído",
        description: "Lembrete marcado como concluído!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao marcar como concluído",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const desmarcarConcluido = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("lembretes")
        .update({ concluido: false })
        .eq("id", id)
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .single();

      if (error) throw error;
      setLembretes((prev) =>
        prev.map((lembrete) => (lembrete.id === id ? (data as Lembrete) : lembrete))
      );

      toast({
        title: "Lembrete reativado",
        description: "Lembrete desmarcado como concluído!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao desmarcar conclusão",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteLembrete = async (id: string) => {
    try {
      const { error } = await supabase.from("lembretes").delete().eq("id", id);

      if (error) throw error;
      setLembretes((prev) => prev.filter((lembrete) => lembrete.id !== id));

      toast({
        title: "Lembrete removido",
        description: "Lembrete removido com sucesso!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover lembrete",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const getLembretesProximos = () => {
    const agora = new Date();
    const proximasHoras = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // Próximas 24 horas
    
    return lembretes.filter(lembrete => {
      const dataLembrete = new Date(lembrete.data_lembrete);
      return !lembrete.concluido && dataLembrete >= agora && dataLembrete <= proximasHoras;
    });
  };

  const getLembretesVencidos = () => {
    const agora = new Date();
    
    return lembretes.filter(lembrete => {
      const dataLembrete = new Date(lembrete.data_lembrete);
      return !lembrete.concluido && dataLembrete < agora;
    });
  };

  useEffect(() => {
    fetchLembretes();
  }, []);

  return {
    lembretes,
    loading,
    createLembrete,
    updateLembrete,
    deleteLembrete,
    marcarComoConcluido,
    desmarcarConcluido,
    getLembretesProximos,
    getLembretesVencidos,
    refetch: fetchLembretes,
  };
};