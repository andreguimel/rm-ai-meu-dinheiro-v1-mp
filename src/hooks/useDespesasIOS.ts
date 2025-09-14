// Hook otimizado para despesas no iOS/iPhone
// Resolve problemas de "websocket not available" usando fallbacks inteligentes

import { useState, useEffect, useRef } from "react";
import { supabase, testRealtimeConnection } from "@/integrations/supabase/ios-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { detectIOSWebSocketIssues } from "@/utils/websocket-config";

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

// Detectar se é iOS
const isIOS = () => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (/Safari/.test(userAgent) && !/Chrome/.test(userAgent));
};

export const useDespesasIOS = () => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'polling'>('connecting');
  const { toast } = useToast();
  const { user } = useAuth();
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchDespesas = async () => {
    if (!mainAccountUserId) return;

    try {
      const { data, error } = await supabase
        .from("despesas")
        .select(
          `
          *,
          categorias (nome, cor, icone)
        `
        )
        .eq("user_id", mainAccountUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDespesas(data || []);
      lastFetchRef.current = Date.now();
      
      if (isIOS()) {
        console.log("🍎 iOS: Despesas carregadas:", data?.length || 0);
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar despesas:", error);
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
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
    console.log("🔄 iOS: Iniciando polling mode para despesas");

    // Polling a cada 10 segundos para iOS
    pollingIntervalRef.current = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      // Só fazer fetch se passou mais de 8 segundos desde o último
      if (timeSinceLastFetch > 8000) {
        console.log("🔄 iOS: Polling update despesas");
        fetchDespesas();
      }
    }, 10000);
  };

  // Configurar realtime com fallback para iOS
  const setupRealtime = async () => {
    if (!mainAccountUserId) return;

    // Testar conectividade realtime primeiro
    const realtimeWorks = await testRealtimeConnection();
    
    if (!realtimeWorks || detectIOSWebSocketIssues().hasIssues) {
      console.log("🍎 iOS: Realtime não funciona para despesas, usando polling");
      setupPolling();
      return;
    }

    try {
      setRealtimeStatus('connecting');
      
      // Limpar canal anterior se existir
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // Configurar realtime para despesas
      channelRef.current = supabase
        .channel("ios_despesas_changes")
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
            fetchDespesas();
          }
        )
        .subscribe((status) => {
          console.log("🍎 iOS: Realtime status despesas:", status);
          
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
            console.log("✅ iOS: Realtime despesas conectado");
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log("❌ iOS: Realtime despesas falhou, usando polling");
            setupPolling();
          }
        });

      // Timeout para fallback
      setTimeout(() => {
        if (realtimeStatus === 'connecting') {
          console.log("⏰ iOS: Realtime despesas timeout, usando polling");
          setupPolling();
        }
      }, 15000);

    } catch (error) {
      console.error("❌ iOS: Erro no realtime despesas, usando polling:", error);
      setupPolling();
    }
  };

  const createDespesa = async (
    despesa: Omit<Despesa, "id" | "user_id" | "created_at" | "updated_at" | "categorias">
  ) => {
    if (!mainAccountUserId)
      return { data: null, error: "User ID da conta principal não encontrado" };

    try {
      const { data, error } = await supabase
        .from("despesas")
        .insert([
          {
            ...despesa,
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
      setDespesas((prev) => [data as Despesa, ...prev]);

      toast({
        title: "Despesa criada",
        description: "Despesa criada com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchDespesas(), 1000);
      }

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
      
      // Atualizar estado local imediatamente
      setDespesas((prev) =>
        prev.map((despesa) =>
          despesa.id === id ? (data as Despesa) : despesa
        )
      );

      toast({
        title: "Despesa atualizada",
        description: "Despesa atualizada com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchDespesas(), 1000);
      }

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
      
      // Atualizar estado local imediatamente
      setDespesas((prev) => prev.filter((despesa) => despesa.id !== id));

      toast({
        title: "Despesa removida",
        description: "Despesa removida com sucesso!",
      });

      // Se estiver em polling mode, forçar update
      if (realtimeStatus === 'polling') {
        setTimeout(() => fetchDespesas(), 1000);
      }

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

  // Effects
  useEffect(() => {
    if (user) {
      getMainAccountUserId();
    }
  }, [user]);

  useEffect(() => {
    if (mainAccountUserId) {
      fetchDespesas();
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

  return {
    despesas,
    loading,
    realtimeStatus,
    createDespesa,
    updateDespesa,
    deleteDespesa,
    refetch: fetchDespesas,
  };
};