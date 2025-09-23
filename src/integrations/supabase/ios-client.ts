import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ixqhqvqhqhqhqhqhqhqh.supabase.co"
const supabasePublicKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFocWhxaHFocWhxaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MDQ4MDAsImV4cCI6MjA0NzE4MDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"

// Detectar iOS/Safari
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));
};

// Detectar modo privado no Safari
const isPrivateMode = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__private_mode_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return false;
  } catch (e) {
    return true;
  }
};

// Armazenamento seguro para iOS
const createIOSStorage = () => {
  const isPrivate = isPrivateMode();
  
  if (isPrivate) {
    console.log('🔒 Modo privado detectado - usando memory storage');
    // Memory storage para modo privado
    const memoryStorage: { [key: string]: string } = {};
    
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
      clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]); }
    };
  }
  
  // localStorage normal para modo não-privado
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
  };
};

// Singleton pattern para iOS client
let iosClientInstance: SupabaseClient | null = null;

const createIOSSupabaseClient = (): SupabaseClient => {
  if (iosClientInstance) {
    console.log('🔄 Reutilizando instância iOS existente do Supabase');
    return iosClientInstance;
  }

  console.log('🍎 Criando nova instância iOS do Supabase');
  iosClientInstance = createClient(supabaseUrl, supabasePublicKey, {
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    auth: {
      storage: createIOSStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Desabilitar para iOS
    }
  });

  return iosClientInstance;
};

// Cliente padrão singleton
let standardClientInstance: SupabaseClient | null = null;

const createStandardSupabaseClient = (): SupabaseClient => {
  if (standardClientInstance) {
    console.log('🔄 Reutilizando instância padrão existente do Supabase');
    return standardClientInstance;
  }

  console.log('💻 Criando nova instância padrão do Supabase');
  standardClientInstance = createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return standardClientInstance;
};

// Exportar cliente único baseado na plataforma
export const supabase = isIOS() ? createIOSSupabaseClient() : createStandardSupabaseClient();