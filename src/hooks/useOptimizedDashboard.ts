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
  
  // Detectar se é iOS para aplicar otimizações específicas
  const isIOSDevice = isIOS();
  
  // Dados essenciais (sempre carregados primeiro)
  const { transacoes, loading: loadingTransacoes } = useTransacoes();
  const { profile, user } = useProfile();
  const { subscriptionData, loading: loadingSubscription } = useSubscription();
  
  // Dados secundários (carregados condicionalmente)
  const { itensMercado, loading: loadingItens } = loadSecondaryData 
    ? useItensMercado() 
    : { itensMercado: null, loading: false };
    
  const { dividas, loading: loadingDividas } = loadSecondaryData 
    ? useDividas() 
    : { dividas: null, loading: false };
    
  const { veiculos, loading: loadingVeiculos } = loadSecondaryData 
    ? useVeiculos() 
    : { veiculos: null, loading: false };
    
  const { tiposManutencao, loading: loadingTiposManutencao } = loadSecondaryData 
    ? useTiposManutencao() 
    : { tiposManutencao: null, loading: false };
    
  const { lembretes, loading: loadingLembretes } = loadSecondaryData 
    ? useLembretes() 
    : { lembretes: null, loading: false };

  // Hook de manutenções pendentes (depende de veículos e tipos)
  const { manutencoesPendentes, loading: loadingManutencoes } = loadSecondaryData && veiculos && tiposManutencao
    ? useManutencoesPendentes(veiculos, tiposManutencao)
    : { manutencoesPendentes: null, loading: false };

  // Verificar se o carregamento inicial está completo
  useEffect(() => {
    if (!loadingTransacoes && !loadingSubscription && profile) {
      setIsInitialLoadComplete(true);
      
      // Para iOS, aguardar um pouco mais antes de carregar dados secundários
      const delay = isIOSDevice ? 1000 : 500;
      
      setTimeout(() => {
        setLoadSecondaryData(true);
      }, delay);
    }
  }, [loadingTransacoes, loadingSubscription, profile, isIOSDevice]);

  // Verificar se o carregamento secundário está completo
  useEffect(() => {
    if (loadSecondaryData && 
        !loadingItens && 
        !loadingDividas && 
        !loadingVeiculos && 
        !loadingTiposManutencao && 
        !loadingLembretes && 
        !loadingManutencoes) {
      setIsSecondaryLoadComplete(true);
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

  return {
    // Dados essenciais
    transacoes,
    loadingTransacoes,
    profile,
    user,
    subscriptionData,
    loadingSubscription,
    
    // Dados secundários
    itensMercado,
    loadingItens,
    dividas,
    loadingDividas,
    veiculos,
    loadingVeiculos,
    tiposManutencao,
    loadingTiposManutencao,
    manutencoesPendentes,
    loadingManutencoes,
    lembretes,
    loadingLembretes,
    
    // Estados de carregamento
    isInitialLoadComplete,
    isSecondaryLoadComplete
  };
};