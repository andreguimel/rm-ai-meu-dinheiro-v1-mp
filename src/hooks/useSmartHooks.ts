// Hook inteligente que detecta automaticamente iOS e usa os hooks otimizados
// Resolve problemas de "websocket not available" de forma transparente

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

// Detectar se precisa usar hooks iOS
const needsIOSOptimization = () => {
  if (!isIOS()) return false;
  
  const iosIssues = detectIOSWebSocketIssues();
  return iosIssues.hasIssues;
};

// Hook inteligente para transações
export const useSmartTransacoes = () => {
  const shouldUseIOS = needsIOSOptimization();
  
  // Log para debug
  if (shouldUseIOS) {
    console.log("🍎 Usando hook iOS otimizado para transações");
  }
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useTransacoes();
  const iosHook = useTransacoesIOS();
  
  return shouldUseIOS ? iosHook : standardHook;
};

// Hook inteligente para receitas
export const useSmartReceitas = () => {
  const shouldUseIOS = needsIOSOptimization();
  
  // Log para debug
  if (shouldUseIOS) {
    console.log("🍎 Usando hook iOS otimizado para receitas");
  }
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useReceitas();
  const iosHook = useReceitasIOS();
  
  return shouldUseIOS ? iosHook : standardHook;
};

// Hook inteligente para despesas
export const useSmartDespesas = () => {
  const shouldUseIOS = needsIOSOptimization();
  
  // Log para debug
  if (shouldUseIOS) {
    console.log("🍎 Usando hook iOS otimizado para despesas");
  }
  
  // Usar hook iOS se necessário, senão usar hook padrão
  const standardHook = useDespesas();
  const iosHook = useDespesasIOS();
  
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