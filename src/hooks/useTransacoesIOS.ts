// Hook otimizado para transações no iOS/iPhone
// Resolve problemas de "websocket not available" usando fallbacks inteligentes

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/ios-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { detectIOSWebSocketIssues } from "@/utils/websocket-config";

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

// Detectar se é iOS
const isIOS = () => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (/Safari/.test(userAgent) && !/Chrome/.test(userAgent));
};

// Hook otimizado para iOS que resolve problemas de WebSocket
export const useTransacoesIOS = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'polling'>('disconnected');
  
  const { toast } = useToast();
  const { user, mainAccountUserId } = useAuth();
  
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const initializationRef = useRef<boolean>(false);

  // CORREÇÃO: Função de fetch com tratamento de erro mais robusto
  const fetchTransacoes = async () => {
    if (!mainAccountUserId) {
      console.warn("⚠️ iOS: mainAccountUserId não disponível");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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

      if (transacoesError) {
        console.error("❌ iOS: Erro ao buscar transações:", transacoesError);
        // NÃO fazer throw aqui, continuar com array vazio
      }

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

      if (receitasError) {
        console.error("❌ iOS: Erro ao buscar receitas:", receitasError);
        // NÃO fazer throw aqui, continuar com array vazio
      }

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
        console.error("❌ iOS: Erro ao buscar despesas:", despesasError);
        // NÃO fazer throw aqui, continuar com array vazio
      }

      // Combinar todos os dados (usando arrays vazios se houver erro)
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
      lastFetchRef.current = Date.now();
      
      if (isIOS()) {
        console.log("🍎 iOS: Transações carregadas:", sortedTransacoes.length);
      }
    } catch (error: any) {
      console.error("❌ iOS: Erro crítico ao carregar transações:", error);
      
      // CORREÇÃO: Em caso de erro crítico, definir array vazio ao invés de falhar
      setTransacoes([]);
      
      // Mostrar toast apenas se não for erro de rede comum
      if (!error.message?.includes('fetch') && !error.message?.includes('network')) {
        toast({
          title: "Erro ao carregar transações",
          description: "Tentando novamente...",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Configurar polling como fallback para iOS
  const setupPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setRealtimeStatus('polling');
    console.log("🔄 iOS: Iniciando polling mode");

    // Polling a cada 10 segundos para iOS
    pollingIntervalRef.current = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      // Só fazer fetch se passou mais de 8 segundos desde o último
      if (timeSinceLastFetch > 8000) {
        console.log("🔄 iOS: Polling update");
        fetchTransacoes();
      }
    }, 10000);
  };

  // Configurar realtime com fallback para iOS
  const setupRealtime = async () => {
    if (!mainAccountUserId) return;

    // Verificar se há problemas de WebSocket no iOS
    const iosIssues = detectIOSWebSocketIssues();
    
    if (iosIssues.hasIssues) {
      console.log("🍎 iOS: WebSocket não funciona, usando polling");
      setupPolling();
      return;
    }

    try {
      setRealtimeStatus('connecting');
      
      // Limpar canal anterior se existir
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // Configurar realtime para todas as tabelas
      channelRef.current = supabase
        .channel("ios_transacoes_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transacoes",
            filter: `user_id=eq.${mainAccountUserId}`,
          },
          (payload) => {
            console.log("🍎 iOS: Transação alterada", payload);
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
          (payload) => {
            console.log("🍎 iOS: Receita alterada", payload);
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
          (payload) => {
            console.log("🍎 iOS: Despesa alterada", payload);
            fetchTransacoes();
          }
        )
        .subscribe((status) => {
          console.log("🍎 iOS: Realtime status:", status);
          
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
            console.log("✅ iOS: Realtime conectado");
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log("❌ iOS: Realtime falhou, usando polling");
            setupPolling();
          }
        });

      // Timeout para fallback
      setTimeout(() => {
        if (realtimeStatus === 'connecting') {
          console.log("⏰ iOS: Realtime timeout, usando polling");
          setupPolling();
        }
      }, 15000);

    } catch (error) {
      console.error("❌ iOS: Erro no realtime, usando polling:", error);
      setupPolling();
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
      
      // Atualizar estado local imediatamente
      setTransacoes((prev) => [data as Transacao, ...prev]);

      toast({
        title: "Transação criada",
        description: "Transação criada com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchTransacoes(), 1000);
      }

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
      
      // Atualizar estado local imediatamente
      setTransacoes((prev) =>
        prev.map((transacao) =>
          transacao.id === id ? (data as Transacao) : transacao
        )
      );

      toast({
        title: "Transação atualizada",
        description: "Transação atualizada com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchTransacoes(), 1000);
      }

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
      
      // Atualizar estado local imediatamente
      setTransacoes((prev) => prev.filter((transacao) => transacao.id !== id));

      toast({
        title: "Transação removida",
        description: "Transação removida com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchTransacoes(), 1000);
      }

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

  // Effects
  useEffect(() => {
    if (mainAccountUserId) {
      fetchTransacoes();
      setupRealtime();
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [mainAccountUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Filtros para compatibilidade
  const receitas = transacoes.filter((t) => t.tipo === "receita");
  const despesas = transacoes.filter((t) => t.tipo === "despesa");

  return {
    transacoes,
    receitas,
    despesas,
    loading,
    realtimeStatus,
    createTransacao,
    updateTransacao,
    deleteTransacao,
    refetch: fetchTransacoes,
  };
};