import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Divida {
  id: string;
  user_id: string;
  categoria_id?: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  valor_restante: number;
  data_vencimento: string;
  parcelas: number;
  parcelas_pagas: number;
  status: 'pendente' | 'vencida' | 'quitada';
  credor: string;
  created_at: string;
  updated_at: string;
  valor_parcela: number;
  dia_vencimento: number;
  mes_inicio: number;
  ano_inicio: number;
  numero_parcela: number;
  divida_pai_id?: string;
  aviso_pagamento: boolean;
  pago: boolean;
  categorias?: {
    nome: string;
    cor: string;
    icone: string;
  };
}

export interface NovaDivida {
  descricao: string;
  credor: string;
  valor_parcela: number;
  parcelas: number;
  categoria_id?: string;
  dia_vencimento: number;
  mes_inicio: number;
  ano_inicio: number;
  aviso_pagamento: boolean;
}

export const useDividas = () => {
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDividas = async () => {
    try {
      const { data, error } = await supabase
        .from('dividas')
        .select(`
          *,
          categorias (nome, cor, icone)
        `)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setDividas((data || []) as Divida[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dívidas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDivida = async (novaDivida: NovaDivida) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuário não autenticado');

      // Gerar todas as parcelas
      const parcelasParaInserir = [];
      for (let i = 1; i <= novaDivida.parcelas; i++) {
        const dataVencimento = new Date(novaDivida.ano_inicio, novaDivida.mes_inicio - 1 + (i - 1), novaDivida.dia_vencimento);
        
        parcelasParaInserir.push({
          user_id: user.data.user.id,
          descricao: novaDivida.descricao,
          credor: novaDivida.credor,
          categoria_id: novaDivida.categoria_id,
          valor_parcela: novaDivida.valor_parcela,
          valor_total: novaDivida.valor_parcela,
          valor_pago: 0,
          valor_restante: novaDivida.valor_parcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          parcelas: novaDivida.parcelas,
          parcelas_pagas: 0,
          numero_parcela: i,
          dia_vencimento: novaDivida.dia_vencimento,
          mes_inicio: novaDivida.mes_inicio,
          ano_inicio: novaDivida.ano_inicio,
          aviso_pagamento: novaDivida.aviso_pagamento,
          pago: false,
          status: dataVencimento < new Date() ? 'vencida' : 'pendente'
        });
      }

      const { data, error } = await supabase
        .from('dividas')
        .insert(parcelasParaInserir)
        .select(`
          *,
          categorias (nome, cor, icone)
        `);

      if (error) throw error;
      
      // Atualizar estado local
      setDividas(prev => [...(data as Divida[]), ...prev]);
      
      toast({
        title: "Parcelas criadas",
        description: `${novaDivida.parcelas} parcelas criadas com sucesso!`,
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar dívida",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateDivida = async (id: string, updates: Partial<Divida>) => {
    try {
      const { data, error } = await supabase
        .from('dividas')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          categorias (nome, cor, icone)
        `)
        .single();

      if (error) throw error;
      setDividas(prev => prev.map(divida => divida.id === id ? data as Divida : divida));
      
      toast({
        title: "Parcela atualizada",
        description: "Parcela atualizada com sucesso!",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar parcela",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const marcarComoPago = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('dividas')
        .update({ pago: true })
        .eq('id', id)
        .select(`
          *,
          categorias (nome, cor, icone)
        `)
        .single();

      if (error) throw error;
      setDividas(prev => prev.map(divida => divida.id === id ? data as Divida : divida));
      
      toast({
        title: "Parcela paga",
        description: "Parcela marcada como paga!",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao marcar como pago",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const desmarcarComoPago = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('dividas')
        .update({ pago: false })
        .eq('id', id)
        .select(`
          *,
          categorias (nome, cor, icone)
        `)
        .single();

      if (error) throw error;
      setDividas(prev => prev.map(divida => divida.id === id ? data as Divida : divida));
      
      toast({
        title: "Pagamento desmarcado",
        description: "Parcela desmarcada como paga!",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao desmarcar pagamento",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteDivida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dividas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDividas(prev => prev.filter(divida => divida.id !== id));
      
      toast({
        title: "Parcela removida",
        description: "Parcela removida com sucesso!",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao remover parcela",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchDividas();
  }, []);

  return {
    dividas,
    loading,
    createDivida,
    updateDivida,
    deleteDivida,
    marcarComoPago,
    desmarcarComoPago,
    refetch: fetchDividas
  };
};