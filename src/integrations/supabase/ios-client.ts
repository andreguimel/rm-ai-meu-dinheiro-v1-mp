// Cliente Supabase otimizado para iOS/iPhone
// Resolve problemas de "websocket not available" no Safari/iOS

import { createClient } from "@supabase/supabase-js";
import { detectIOSWebSocketIssues } from "@/utils/websocket-config";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ponxumxwjodpgwhepwxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";

// Detectar se é iOS/Safari
const isIOS = () => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (/Safari/.test(userAgent) && !/Chrome/.test(userAgent));
};

// Detectar se está em modo privado
const isPrivateMode = () => {
  try {
    localStorage.setItem("__test__", "test");
    localStorage.removeItem("__test__");
    return false;
  } catch {
    return true;
  }
};

// Storage seguro para iOS
function createIOSSafeStorage() {
  if (isPrivateMode()) {
    console.warn("iOS Private Mode detected - using memory storage");
    // Fallback para memory storage no modo privado
    const memoryStorage: Storage = {
      length: 0,
      clear: () => {},
      getItem: (key: string) => null,
      key: (index: number) => null,
      removeItem: (key: string) => {},
      setItem: (key: string, value: string) => {},
    };
    return memoryStorage;
  }
  return localStorage;
}

// Configurações otimizadas para iOS
const getIOSOptimizedConfig = () => {
  const iosIssues = detectIOSWebSocketIssues();
  const hasWebSocketIssues = iosIssues.hasIssues;
  
  console.log("🍎 iOS WebSocket Issues:", iosIssues);

  return {
    auth: {
      storage: createIOSSafeStorage(),
      persistSession: !isPrivateMode(),
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce" as const,
    },
    realtime: {
      // Configurações específicas para iOS
      params: {
        eventsPerSecond: 2, // Reduzir frequência para iOS
      },
      // Usar polling se WebSocket não funcionar
      transport: hasWebSocketIssues ? "polling" : "websocket",
      // Timeout mais longo para iOS
      timeout: 30000,
      // Heartbeat mais frequente
      heartbeatIntervalMs: 15000,
      // Reconexão mais agressiva
      reconnectAfterMs: (tries: number) => {
        return Math.min(1000 * Math.pow(2, tries), 10000);
      },
    },
    // Headers específicos para iOS
    global: {
      headers: {
        'User-Agent': navigator.userAgent,
        'X-iOS-Client': isIOS() ? 'true' : 'false',
        'X-Private-Mode': isPrivateMode() ? 'true' : 'false',
      },
    },
  };
};

// Cliente otimizado para iOS
export const supabaseIOS = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  getIOSOptimizedConfig()
);

// Cliente padrão (fallback)
export const supabaseStandard = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: createIOSSafeStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);

// Cliente inteligente que escolhe automaticamente
export const supabase = isIOS() ? supabaseIOS : supabaseStandard;

// Função para testar conectividade realtime
export const testRealtimeConnection = async () => {
  return new Promise((resolve) => {
    const channel = supabase.channel('test-connection');
    
    const timeout = setTimeout(() => {
      channel.unsubscribe();
      resolve(false);
    }, 10000);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        clearTimeout(timeout);
        channel.unsubscribe();
        resolve(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          channel.unsubscribe();
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          channel.unsubscribe();
          resolve(false);
        }
      });
  });
};

// Log de debug para iOS
if (isIOS()) {
  console.log("🍎 iOS Supabase Client initialized with optimizations");
  console.log("📱 User Agent:", navigator.userAgent);
  console.log("🔒 Private Mode:", isPrivateMode());
  console.log("🌐 Protocol:", window.location.protocol);
}

// Exportar tipos
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};