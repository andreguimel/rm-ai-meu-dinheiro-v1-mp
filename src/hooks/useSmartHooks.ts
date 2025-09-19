// Hook inteligente que detecta automaticamente iOS e usa os hooks otimizados
// Resolve problemas de "websocket not available" de forma transparente

import { useState, useEffect } from "react";
import { useTransacoes } from "./useTransacoes";
import { useTransacoesIOS } from "./useTransacoesIOS";
import { useReceitas } from "./useReceitas";
import { useReceitasIOS } from "./useReceitasIOS";
import { useDespesas } from "./useDespesas";
import { useDespesasIOS } from "./useDespesasIOS";
import { detectIOSWebSocketIssues } from "@/utils/websocket-config";

// Detectar se é iOS/Safari
const isIOS = () => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (/Safari/.test(userAgent) && !/Chrome/.test(userAgent));
};

// Detectar se precisa usar hooks iOS - VERSÃO MAIS CONSERVADORA
const needsIOSOptimization = () => {
  if (!isIOS()) return false;
  
  try {
    const iosIssues = detectIOSWebSocketIssues();
    
    // CORREÇÃO: Só usar hooks iOS se houver problemas REAIS e CRÍTICOS
    // Não apenas por ser iOS, mas por ter problemas concretos
    const hasCriticalIssues = iosIssues.hasIssues && iosIssues.issues.some(issue => 
      issue.includes("não disponível") || 
      issue.includes("Modo privado")
    );
    
    console.log("🔍 iOS Optimization Check:", {
      isIOS: isIOS(),
      hasIssues: iosIssues.hasIssues,
      hasCriticalIssues,
      issues: iosIssues.issues,
      willUseIOSHooks: hasCriticalIssues
    });
    
    return hasCriticalIssues;
  } catch (error) {
    console.warn("⚠️ Erro ao detectar problemas iOS, usando hooks padrão:", error);
    return false; // Em caso de erro, usar hooks padrão
  }
};

// Hook inteligente para transações
export const useSmartTransacoes = () => {
  const [shouldUseIOS, setShouldUseIOS] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    try {
      const useIOS = needsIOSOptimization();
      setShouldUseIOS(useIOS);
      setIsReady(true);
      
      if (useIOS) {
        console.log("🍎 Usando hook iOS otimizado para transações");
      } else {
        console.log("📱 Usando hook padrão para transações");
      }
    } catch (error) {
      console.warn("⚠️ Erro na detecção iOS, usando hook padrão:", error);
      setShouldUseIOS(false);
      setIsReady(true);
    }
  }, []);
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useTransacoes();
  const iosHook = useTransacoesIOS();
  
  // Retornar hook padrão se ainda não estiver pronto ou em caso de erro
  if (!isReady) {
    return standardHook;
  }
  
  return shouldUseIOS ? iosHook : standardHook;
};

// Hook inteligente para receitas
export const useSmartReceitas = () => {
  const [shouldUseIOS, setShouldUseIOS] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    try {
      const useIOS = needsIOSOptimization();
      setShouldUseIOS(useIOS);
      setIsReady(true);
      
      if (useIOS) {
        console.log("🍎 Usando hook iOS otimizado para receitas");
      } else {
        console.log("📱 Usando hook padrão para receitas");
      }
    } catch (error) {
      console.warn("⚠️ Erro na detecção iOS, usando hook padrão:", error);
      setShouldUseIOS(false);
      setIsReady(true);
    }
  }, []);
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useReceitas();
  const iosHook = useReceitasIOS();
  
  // Retornar hook padrão se ainda não estiver pronto ou em caso de erro
  if (!isReady) {
    return standardHook;
  }
  
  return shouldUseIOS ? iosHook : standardHook;
};

// Hook inteligente para despesas
export const useSmartDespesas = () => {
  const [shouldUseIOS, setShouldUseIOS] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    try {
      const useIOS = needsIOSOptimization();
      setShouldUseIOS(useIOS);
      setIsReady(true);
      
      if (useIOS) {
        console.log("🍎 Usando hook iOS otimizado para despesas");
      } else {
        console.log("📱 Usando hook padrão para despesas");
      }
    } catch (error) {
      console.warn("⚠️ Erro na detecção iOS, usando hook padrão:", error);
      setShouldUseIOS(false);
      setIsReady(true);
    }
  }, []);
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useDespesas();
  const iosHook = useDespesasIOS();
  
  // Retornar hook padrão se ainda não estiver pronto ou em caso de erro
  if (!isReady) {
    return standardHook;
  }
  
  return shouldUseIOS ? iosHook : standardHook;
};

// Função para verificar status dos hooks
export const getHookStatus = () => {
  const isIOSDevice = isIOS();
  const hasIOSIssues = needsIOSOptimization();
  const iosIssues = detectIOSWebSocketIssues();
  
  return {
    isIOSDevice,
    hasIOSIssues,
    usingIOSHooks: hasIOSIssues,
    iosIssues: iosIssues.issues,
    userAgent: navigator.userAgent,
    protocol: window.location.protocol,
  };
};

// Log inicial para debug
if (typeof window !== 'undefined') {
  const status = getHookStatus();
  console.log("🔍 Smart Hooks Status:", status);
  
  if (status.hasIOSIssues) {
    console.log("🍎 iOS WebSocket issues detected, using optimized hooks");
    console.log("📋 Issues:", status.iosIssues);
  }
}