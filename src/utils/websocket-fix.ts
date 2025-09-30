/**
 * Utilitário para corrigir problemas de WebSocket em HTTPS
 * Especificamente para resolver o erro "WebSocket not available: The operation is insecure."
 */

// Função para detectar se estamos em ambiente HTTPS
export const isHTTPSEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
};

// Função para corrigir URL do WebSocket para usar WSS em HTTPS
export const fixWebSocketURL = (url: string): string => {
  if (!isHTTPSEnvironment()) return url;
  
  // Se estamos em HTTPS, garantir que WebSocket use WSS
  if (url.startsWith('ws://')) {
    return url.replace('ws://', 'wss://');
  }
  
  if (url.startsWith('http://')) {
    return url.replace('http://', 'wss://');
  }
  
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  
  return url;
};

// Função para aplicar configurações seguras de WebSocket
export const applySecureWebSocketConfig = () => {
  if (typeof window === 'undefined') return;
  
  const isHTTPS = isHTTPSEnvironment();
  
  console.log('🔒 Aplicando configurações seguras de WebSocket:', {
    protocol: window.location.protocol,
    isHTTPS,
    userAgent: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Other',
  });
  
  // Configurações globais para WebSocket seguro
  (window as any).__websocket_secure_config = {
    forceWSS: isHTTPS,
    protocol: isHTTPS ? 'wss:' : 'ws:',
    timestamp: new Date().toISOString(),
  };
  
  // Interceptar criação de WebSocket para forçar WSS em HTTPS
  if (isHTTPS && window.WebSocket) {
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        const fixedUrl = typeof url === 'string' ? fixWebSocketURL(url) : url;
        console.log('🔌 WebSocket interceptado:', {
          original: url.toString(),
          fixed: fixedUrl.toString(),
          isSecure: fixedUrl.toString().startsWith('wss://'),
        });
        super(fixedUrl, protocols);
      }
    } as any;
  }
};

// Função para verificar se WebSocket está funcionando corretamente
export const testWebSocketConnection = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const fixedUrl = fixWebSocketURL(url);
      const ws = new WebSocket(fixedUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
    } catch (error) {
      console.error('Erro ao testar WebSocket:', error);
      resolve(false);
    }
  });
};

// Aplicar configurações automaticamente quando o módulo for importado
if (typeof window !== 'undefined') {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySecureWebSocketConfig);
  } else {
    applySecureWebSocketConfig();
  }
}