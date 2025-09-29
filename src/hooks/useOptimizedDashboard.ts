import { useState, useEffect } from "react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useItensMercado } from "@/hooks/useItensMercado";
import { useDividas } from "@/hooks/useDividas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useTiposManutencao } from "@/hooks/useTiposManutencao";
import { useManutencoesPendentes } from "@/hooks/useManutencoesPendentes";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useLembretes } from "@/hooks/useLembretes";
import { isIOS } from "@/lib/ios-safe-utils";

interface OptimizedDashboardData {
  // Dados essenciais (carregados primeiro)
  transacoes: any[] | null;
  loadingTransacoes: boolean;
  profile: any;
  user: any;
  subscriptionData: any;
  loadingSubscription: boolean;
  
  // Dados secundários (carregados depois)
  itensMercado: any[] | null;
  loadingItens: boolean;
  dividas: any[] | null;
  loadingDividas: boolean;
  veiculos: any[] | null;
  loadingVeiculos: boolean;
  tiposManutencao: any[] | null;
  loadingTiposManutencao: boolean;
  manutencoesPendentes: any[] | null;
  loadingManutencoes: boolean;
  lembretes: any[] | null;
  loadingLembretes: boolean;
  
  // Estado de carregamento
  isInitialLoadComplete: boolean;
  isSecondaryLoadComplete: boolean;
}

export const useOptimizedDashboard = (): OptimizedDashboardData => {
  const [loadSecondaryData, setLoadSecondaryData] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isSecondaryLoadComplete, setIsSecondaryLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detectar se é iOS para aplicar otimizações específicas
  const isIOSDevice = isIOS();
  
  // Dados essenciais (sempre carregados primeiro) - com tratamento de erro
  let transacoesHook, profileHook, subscriptionHook;
  
  try {
    transacoesHook = useTransacoes();
  } catch (err) {
    console.error('Erro no hook useTransacoes:', err);
    transacoesHook = { transacoes: [], loading: false };
  }
  
  try {
    profileHook = useProfile();
  } catch (err) {
    console.error('Erro no hook useProfile:', err);
    profileHook = { profile: null, user: null };
  }
  
  try {
    subscriptionHook = useSubscription();
  } catch (err) {
    console.error('Erro no hook useSubscription:', err);
    subscriptionHook = { subscriptionData: null, loading: false };
  }
  
  const { transacoes, loading: loadingTransacoes } = transacoesHook;
  const { profile, user } = profileHook;
  const { subscriptionData, loading: loadingSubscription } = subscriptionHook;
  
  // Dados secundários - sempre chamar os hooks, mas controlar o comportamento interno
  let itensHook, dividasHook, veiculosHook, tiposHook, lembretesHook;
  
  try {
    itensHook = useItensMercado();
  } catch (err) {
    console.error('Erro no hook useItensMercado:', err);
    itensHook = { itensMercado: [], loading: false };
  }
  
  try {
    dividasHook = useDividas();
  } catch (err) {
    console.error('Erro no hook useDividas:', err);
    dividasHook = { dividas: [], loading: false };
  }
  
  try {
    veiculosHook = useVeiculos();
  } catch (err) {
    console.error('Erro no hook useVeiculos:', err);
    veiculosHook = { veiculos: [], loading: false };
  }
  
  try {
    tiposHook = useTiposManutencao();
  } catch (err) {
    console.error('Erro no hook useTiposManutencao:', err);
    tiposHook = { tiposManutencao: [], loading: false };
  }
  
  try {
    lembretesHook = useLembretes();
  } catch (err) {
    console.error('Erro no hook useLembretes:', err);
    lembretesHook = { lembretes: [], loading: false };
  }
  
  // Aplicar lógica condicional nos dados retornados, não na chamada dos hooks
  const { itensMercado: rawItensMercado, loading: loadingItens } = itensHook;
  const { dividas: rawDividas, loading: loadingDividas } = dividasHook;
  const { veiculos: rawVeiculos, loading: loadingVeiculos } = veiculosHook;
  const { tiposManutencao: rawTiposManutencao, loading: loadingTiposManutencao } = tiposHook;
  const { lembretes: rawLembretes, loading: loadingLembretes } = lembretesHook;

  // Controlar quais dados são expostos baseado no loadSecondaryData
  const itensMercado = loadSecondaryData ? rawItensMercado : null;
  const dividas = loadSecondaryData ? rawDividas : null;
  const veiculos = loadSecondaryData ? rawVeiculos : null;
  const tiposManutencao = loadSecondaryData ? rawTiposManutencao : null;
  const lembretes = loadSecondaryData ? rawLembretes : null;

  // Hook de manutenções pendentes (depende de veículos e tipos) - com tratamento de erro
  let manutencoesHook;
  try {
    manutencoesHook = useManutencoesPendentes(rawVeiculos || [], rawTiposManutencao || []);
  } catch (err) {
    console.error('Erro no hook useManutencoesPendentes:', err);
    manutencoesHook = { manutencoesPendentes: [], loading: false };
  }
  
  const { manutencoesPendentes: rawManutencoesPendentes, loading: loadingManutencoes } = manutencoesHook;
  const manutencoesPendentes = loadSecondaryData && veiculos && tiposManutencao ? rawManutencoesPendentes : null;

  // Verificar se o carregamento inicial está completo
  useEffect(() => {
    try {
      if (!loadingTransacoes && !loadingSubscription && profile) {
        setIsInitialLoadComplete(true);
        
        // Para iOS, aguardar mais tempo antes de carregar dados secundários
        const delay = isIOSDevice ? 2000 : 500;
        
        const timer = setTimeout(() => {
          setLoadSecondaryData(true);
        }, delay);
        
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Erro no useEffect inicial:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [loadingTransacoes, loadingSubscription, profile, isIOSDevice]);

  // Verificar se o carregamento secundário está completo
  useEffect(() => {
    try {
      if (loadSecondaryData && 
          !loadingItens && 
          !loadingDividas && 
          !loadingVeiculos && 
          !loadingTiposManutencao && 
          !loadingLembretes && 
          !loadingManutencoes) {
        setIsSecondaryLoadComplete(true);
      }
    } catch (err) {
      console.error('Erro no useEffect secundário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [
    loadSecondaryData,
    loadingItens,
    loadingDividas,
    loadingVeiculos,
    loadingTiposManutencao,
    loadingLembretes,
    loadingManutencoes
  ]);

  // Log de debug para iPhone
  useEffect(() => {
    if (isIOSDevice) {
      console.log('🍎 Dashboard iOS - Estado atual:', {
        isInitialLoadComplete,
        isSecondaryLoadComplete,
        loadSecondaryData,
        error,
        loadingTransacoes,
        loadingSubscription,
        profile: !!profile
      });
    }
  }, [isIOSDevice, isInitialLoadComplete, isSecondaryLoadComplete, loadSecondaryData, error, loadingTransacoes, loadingSubscription, profile]);

  return {
    // Dados essenciais
    transacoes: transacoes || [],
    loadingTransacoes,
    profile,
    user,
    subscriptionData,
    loadingSubscription,
    
    // Dados secundários
    itensMercado: itensMercado || [],
    loadingItens,
    dividas: dividas || [],
    loadingDividas,
    veiculos: veiculos || [],
    loadingVeiculos,
    tiposManutencao: tiposManutencao || [],
    loadingTiposManutencao,
    manutencoesPendentes: manutencoesPendentes || [],
    loadingManutencoes,
    lembretes: lembretes || [],
    loadingLembretes,
    
    // Estados de carregamento
    isInitialLoadComplete,
    isSecondaryLoadComplete
  };
};