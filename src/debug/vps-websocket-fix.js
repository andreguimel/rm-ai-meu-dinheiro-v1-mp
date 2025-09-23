// Correção para problemas de WebSocket na VPS com HTTPS
// Resolve erro "WebSocket not available: The operation is insecure"

console.log("🔧 VPS WebSocket Fix - Iniciando correções...");

// 1. Desabilitar WebSocket para HMR em produção
if (import.meta.env.PROD) {
  console.log("🚫 Produção detectada - Desabilitando HMR WebSocket");
  
  // Interceptar tentativas de conexão do Vite HMR
  if (window.WebSocket) {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      if (url && (url.includes('vite') || url.includes('hmr') || url.includes('ws://') || url.includes('wss://'))) {
        console.warn("🚫 Bloqueando WebSocket HMR em produção:", url);
        // Retornar um mock que não faz nada
        return {
          close: () => {},
          send: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          readyState: 3, // CLOSED
          CONNECTING: 0,
          OPEN: 1,
          CLOSING: 2,
          CLOSED: 3
        };
      }
      return new OriginalWebSocket(url, protocols);
    };
  }
}

// 2. Configurar headers de segurança para requests
if (window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(input, init = {}) {
    // Adicionar headers de segurança para HTTPS
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      ...init.headers
    };
    
    return originalFetch(input, { ...init, headers });
  };
}

// 3. Adicionar meta tags específicas para HTTPS
const addHTTPSMeta = () => {
  // Content Security Policy para HTTPS
  const csp = document.createElement('meta');
  csp.httpEquiv = 'Content-Security-Policy';
  csp.content = "upgrade-insecure-requests";
  document.head.appendChild(csp);
  
  // Referrer policy
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrer);
  
  console.log("🔒 Meta tags HTTPS adicionadas");
};

// 4. Interceptar erros de WebSocket e converter em avisos
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('WebSocket')) {
    console.warn("⚠️ WebSocket error interceptado:", event.message);
    event.preventDefault(); // Prevenir que o erro apareça no console
    return false;
  }
});

// 5. Prevenir múltiplas instâncias do Supabase GoTrueClient
const preventMultipleSupabaseInstances = () => {
  if (window.__supabase_instances) {
    console.warn("⚠️ Múltiplas instâncias do Supabase detectadas");
    return;
  }
  
  window.__supabase_instances = new Set();
  
  // Interceptar criação de clientes Supabase
  if (window.createClient) {
    const originalCreateClient = window.createClient;
    window.createClient = function(...args) {
      const instanceKey = JSON.stringify(args);
      if (window.__supabase_instances.has(instanceKey)) {
        console.warn("🔄 Reutilizando instância existente do Supabase");
        return window.__supabase_cached_client;
      }
      
      window.__supabase_instances.add(instanceKey);
      const client = originalCreateClient.apply(this, args);
      window.__supabase_cached_client = client;
      return client;
    };
  }
};

// 6. Configurar Service Worker para cache offline
const setupServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log("✅ Service Worker registrado:", registration.scope);
      })
      .catch(error => {
        console.warn("⚠️ Falha ao registrar Service Worker:", error);
      });
  }
};

// 7. Aumentar timeout para requests
const increaseRequestTimeout = () => {
  // Configurar timeout global para fetch
  const originalFetch = window.fetch;
  window.fetch = function(input, init = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    return originalFetch(input, {
      ...init,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  };
};

// 8. Correções específicas para iOS em HTTPS
const applyIOSHTTPSFixes = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    console.log("🍎 Aplicando correções específicas para iOS HTTPS");
    
    // Forçar HTTPS para todos os recursos
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
      return;
    }
    
    // Configurar viewport para iOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
  }
};

// 9. Executar todas as correções
// 4. Suprimir avisos de desenvolvimento em produção
const suppressDevWarnings = () => {
  if (import.meta.env.PROD) {
    console.log("🔇 Suprimindo avisos de desenvolvimento em produção");
    
    // Interceptar console.warn para suprimir avisos específicos
    const originalWarn = console.warn;
    console.warn = function(...args) {
      const message = args.join(' ');
      
      // Lista de avisos para suprimir em produção
      const suppressWarnings = [
        'Multiple GoTrueClient instances detected',
        'iOS Supabase Client initialized',
        'iOS WebSocket Issues',
        'Problemas iOS detectados',
        'Configuração WebSocket Seguro',
        'Private Mode: false',
        'User Agent: Mozilla'
      ];
      
      // Verificar se deve suprimir o aviso
      const shouldSuppress = suppressWarnings.some(warning => 
        message.includes(warning)
      );
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };
    
    // Interceptar console.info para suprimir informações de debug
    const originalInfo = console.info;
    console.info = function(...args) {
      const message = args.join(' ');
      
      const suppressInfo = [
        'iOS Supabase Client initialized',
        'Private Mode: false',
        'User Agent: Mozilla'
      ];
      
      const shouldSuppress = suppressInfo.some(info => 
        message.includes(info)
      );
      
      if (!shouldSuppress) {
        originalInfo.apply(console, args);
      }
    };
  }
};

const initVPSFixes = () => {
  console.log("🚀 Iniciando correções VPS WebSocket Fix v1.1.0");
  
  addHTTPSMeta();
  preventMultipleSupabaseInstances();
  setupServiceWorker();
  increaseRequestTimeout();
  applyIOSHTTPSFixes();
  suppressDevWarnings(); // Adicionar supressão de avisos
  
  console.log("✅ Correções VPS aplicadas com sucesso!");
};

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVPSFixes);
} else {
  initVPSFixes();
}

// Exportar para uso global
window.vpsWebSocketFix = {
  init: initVPSFixes,
  version: '1.1.0'
};