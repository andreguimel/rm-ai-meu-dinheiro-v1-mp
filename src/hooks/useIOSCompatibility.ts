import { useState, useEffect, useCallback } from 'react';

interface IOSCompatibilityState {
  isIOS: boolean;
  isPrivateMode: boolean;
  isSafari: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  userAgent: string;
}

interface IOSCompatibilityHook extends IOSCompatibilityState {
  loading: boolean;
  error: string | null;
  refreshCompatibility: () => Promise<void>;
  clearStorageAndReload: () => void;
  forceReload: () => void;
}

// Detectar iOS
const detectIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
};

// Detectar Safari
const detectSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
};

// Testar localStorage
const testLocalStorage = (): boolean => {
  try {
    const testKey = '__ios_compat_test_local__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Testar sessionStorage
const testSessionStorage = (): boolean => {
  try {
    const testKey = '__ios_compat_test_session__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Detectar modo privado (principalmente Safari)
const detectPrivateMode = async (): Promise<boolean> => {
  try {
    // Método 1: Testar localStorage
    if (!testLocalStorage()) {
      return true;
    }
    
    // Método 2: Testar indexedDB (mais confiável no Safari)
    if (typeof window.indexedDB !== 'undefined') {
      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('__private_mode_test__', 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
        
        db.close();
        
        // Tentar deletar o banco de teste
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase('__private_mode_test__');
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        });
        
        return false;
      } catch {
        return true;
      }
    }
    
    return false;
  } catch {
    return true;
  }
};

// Obter informações do viewport
const getViewportInfo = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, devicePixelRatio: 1 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };
};

export const useIOSCompatibility = (): IOSCompatibilityHook => {
  const [state, setState] = useState<IOSCompatibilityState>({
    isIOS: false,
    isPrivateMode: false,
    isSafari: false,
    supportsLocalStorage: false,
    supportsSessionStorage: false,
    viewport: { width: 0, height: 0, devicePixelRatio: 1 },
    userAgent: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkCompatibility = useCallback(async (): Promise<IOSCompatibilityState> => {
    try {
      const isIOS = detectIOS();
      const isSafari = detectSafari();
      const supportsLocalStorage = testLocalStorage();
      const supportsSessionStorage = testSessionStorage();
      const isPrivateMode = await detectPrivateMode();
      const viewport = getViewportInfo();
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';

      return {
        isIOS,
        isPrivateMode,
        isSafari,
        supportsLocalStorage,
        supportsSessionStorage,
        viewport,
        userAgent
      };
    } catch (err) {
      throw new Error(`Erro ao verificar compatibilidade iOS: ${err}`);
    }
  }, []);

  const refreshCompatibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newState = await checkCompatibility();
      setState(newState);
      
      // Log para debug
      if (newState.isIOS) {
        console.log('🍎 iOS Compatibility Check:', {
          ...newState,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro na verificação de compatibilidade iOS:', err);
    } finally {
      setLoading(false);
    }
  }, [checkCompatibility]);

  const clearStorageAndReload = useCallback(() => {
    try {
      // Tentar limpar localStorage
      if (state.supportsLocalStorage) {
        localStorage.clear();
      }
      
      // Tentar limpar sessionStorage
      if (state.supportsSessionStorage) {
        sessionStorage.clear();
      }
      
      // Limpar cookies (se possível)
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }
      
      console.log('🧹 Storage limpo, recarregando página...');
    } catch (err) {
      console.warn('⚠️ Não foi possível limpar todo o storage:', err);
    } finally {
      window.location.reload();
    }
  }, [state.supportsLocalStorage, state.supportsSessionStorage]);

  const forceReload = useCallback(() => {
    console.log('🔄 Forçando reload da página...');
    window.location.reload();
  }, []);

  // Verificação inicial
  useEffect(() => {
    refreshCompatibility();
  }, [refreshCompatibility]);

  // Listener para mudanças de viewport (importante no iOS)
  useEffect(() => {
    if (!state.isIOS) return;

    const handleResize = () => {
      const newViewport = getViewportInfo();
      setState(prev => ({
        ...prev,
        viewport: newViewport
      }));
    };

    const handleOrientationChange = () => {
      // Delay para aguardar a mudança de orientação completar
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [state.isIOS]);

  // Listener para detectar quando a página fica visível novamente (importante no iOS)
  useEffect(() => {
    if (!state.isIOS) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Página ficou visível novamente no iOS');
        // Pequeno delay para re-verificar compatibilidade
        setTimeout(() => {
          refreshCompatibility();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isIOS, refreshCompatibility]);

  return {
    ...state,
    loading,
    error,
    refreshCompatibility,
    clearStorageAndReload,
    forceReload
  };
};

export default useIOSCompatibility;