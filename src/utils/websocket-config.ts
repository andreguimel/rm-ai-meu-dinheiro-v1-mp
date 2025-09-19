/**
 * Configuração automática para WebSocket seguro
 * Resolve problemas de WebSocket inseguros em produção e desenvolvimento
 */

// Detectar ambiente e protocolo
export const getWebSocketConfig = () => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  const currentProtocol = window.location.protocol;
  const currentHost = window.location.host;

  // Configurações baseadas no ambiente
  const config = {
    // Protocolo WebSocket seguro
    protocol: isProduction || currentProtocol === "https:" ? "wss:" : "ws:",

    // Host e porta
    host: isProduction ? currentHost : "localhost",
    port: isProduction ? (currentProtocol === "https:" ? 443 : 80) : 24678,

    // URL completa do WebSocket
    url: "",

    // Configurações de fallback
    fallback: {
      enabled: true,
      polling: true,
      timeout: 5000,
      retries: 3,
    },

    // Configurações específicas para iOS/Safari
    ios: {
      forcePolling: false,
      disableWebSocket: false,
    },
  };

  // Construir URL do WebSocket
  if (isProduction) {
    config.url = `${config.protocol}//${config.host}/ws`;
  } else {
    config.url = `${config.protocol}//${config.host}:${config.port}`;
  }

  return config;
};

// Detectar se WebSocket é suportado e seguro
export const isWebSocketSecure = (): boolean => {
  if (!window.WebSocket) {
    console.warn("WebSocket não suportado neste navegador");
    return false;
  }

  const isHTTPS = window.location.protocol === "https:";
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Em HTTPS, WebSocket deve usar WSS
  if (isHTTPS) {
    return true; // WSS será usado automaticamente
  }

  // Em localhost HTTP, WS é aceitável
  if (isLocalhost && window.location.protocol === "http:") {
    return true;
  }

  // Em outros casos HTTP, pode haver problemas de segurança
  console.warn("WebSocket pode ser inseguro em HTTP não-localhost");
  return false;
};

// Detectar problemas específicos do iOS/Safari
export const detectIOSWebSocketIssues = (): {
  hasIssues: boolean;
  issues: string[];
} => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

  const issues: string[] = [];

  if (isIOS || isSafari) {
    // Verificar se está em modo privado
    try {
      localStorage.setItem("__test__", "test");
      localStorage.removeItem("__test__");
    } catch {
      issues.push(
        "Modo privado detectado - pode causar problemas de WebSocket"
      );
    }

    // CORREÇÃO: Só considerar problema se for HTTPS em produção com problemas reais
    // Não bloquear localhost ou desenvolvimento
    if (
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("192.168") &&
      !window.location.hostname.includes("127.0.0.1")
    ) {
      // Só adicionar se realmente não conseguir conectar WebSocket
      try {
        const testWs = new WebSocket('ws://localhost:3001');
        testWs.close();
      } catch (e) {
        issues.push("HTTP inseguro em iOS - WebSocket pode falhar");
      }
    }

    // Verificar se WebSocket está disponível
    if (!window.WebSocket) {
      issues.push("WebSocket não disponível no Safari");
    }
  }

  // CORREÇÃO CRÍTICA: Ser mais conservador - só retornar hasIssues se houver problemas REAIS
  // Não apenas por ser iOS, mas por ter problemas concretos
  const hasRealIssues = issues.length > 0 && issues.some(issue => 
    issue.includes("não disponível") || 
    issue.includes("Modo privado")
  );

  return {
    hasIssues: hasRealIssues,
    issues,
  };
};

// Aplicar configurações de WebSocket seguro
export const applySecureWebSocketConfig = () => {
  const config = getWebSocketConfig();
  const iosIssues = detectIOSWebSocketIssues();

  console.log("🔒 Configuração WebSocket Seguro:", {
    config,
    isSecure: isWebSocketSecure(),
    iosIssues,
  });

  // Se há problemas no iOS, aplicar fallbacks
  if (iosIssues.hasIssues) {
    console.warn("⚠️ Problemas iOS detectados:", iosIssues.issues);

    // Forçar polling se necessário
    if (iosIssues.issues.some((issue) => issue.includes("HTTP inseguro"))) {
      config.ios.forcePolling = true;
      console.log("🔄 Forçando polling para iOS");
    }
  }

  // Expor configuração globalmente para debug
  (window as any).__websocketConfig = config;

  return config;
};

// Criar WebSocket com configuração segura
export const createSecureWebSocket = (url?: string): WebSocket | null => {
  const config = getWebSocketConfig();
  const wsUrl = url || config.url;

  try {
    // Verificar se deve usar polling em vez de WebSocket
    if (config.ios.forcePolling || config.ios.disableWebSocket) {
      console.log("📡 Usando polling em vez de WebSocket");
      return null; // Retorna null para indicar que deve usar polling
    }

    console.log("🔌 Criando WebSocket seguro:", wsUrl);
    const ws = new WebSocket(wsUrl);

    // Configurar timeouts
    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.warn("⏰ WebSocket timeout - fechando conexão");
        ws.close();
      }
    }, config.fallback.timeout);

    ws.addEventListener("open", () => {
      clearTimeout(timeout);
      console.log("✅ WebSocket conectado com sucesso");
    });

    ws.addEventListener("error", (error) => {
      clearTimeout(timeout);
      console.error("❌ Erro no WebSocket:", error);
    });

    return ws;
  } catch (error) {
    console.error("❌ Falha ao criar WebSocket:", error);
    return null;
  }
};

// Função para testar conectividade WebSocket
export const testWebSocketConnection = async (
  url?: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    const config = getWebSocketConfig();
    const testUrl = url || config.url;

    try {
      const ws = new WebSocket(testUrl);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.addEventListener("open", () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });

      ws.addEventListener("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
};

// Inicialização automática
if (typeof window !== "undefined") {
  // Aplicar configurações na inicialização
  document.addEventListener("DOMContentLoaded", () => {
    applySecureWebSocketConfig();
  });

  // Se já carregou, aplicar imediatamente
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    applySecureWebSocketConfig();
  }
}
