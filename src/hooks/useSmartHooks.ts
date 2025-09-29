// Hook universal que funciona em todos os dispositivos
// Removido sistema específico para iOS - agora usa apenas hooks padrão

import { useTransacoes } from "./useTransacoes";
import { useReceitas } from "./useReceitas";
import { useDespesas } from "./useDespesas";

// Hooks universais que funcionam em todos os dispositivos
export const useSmartTransacoes = () => {
  return useTransacoes();
};

export const useSmartReceitas = () => {
  return useReceitas();
};

export const useSmartDespesas = () => {
  return useDespesas();
};

// Função para verificar status dos hooks (simplificada)
export const getHookStatus = () => {
  return {
    usingUniversalHooks: true,
    userAgent: navigator.userAgent,
    protocol: window.location.protocol,
  };
};

// Log inicial para debug
if (typeof window !== 'undefined') {
  const status = getHookStatus();
  console.log("🔍 Universal Hooks Status:", status);
}