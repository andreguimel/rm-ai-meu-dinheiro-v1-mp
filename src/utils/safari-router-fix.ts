/**
 * Utilitários para corrigir problemas de roteamento no Safari/iPhone
 */

// Detectar se é Safari (não Chrome)
export const isSafari = (): boolean => {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

// Detectar se é iOS
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Detectar se é Safari no iOS
export const isSafariIOS = (): boolean => {
  return isSafari() && isIOS();
};

/**
 * Polyfill para History API no Safari
 * Alguns problemas de roteamento no Safari podem ser causados por
 * implementações inconsistentes da History API
 */
export const initSafariHistoryFix = (): void => {
  if (!isSafariIOS()) return;

  // Garantir que o history.pushState funcione corretamente
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    try {
      originalPushState.call(history, state, title, url);
      // Forçar um evento popstate para garantir que o React Router detecte a mudança
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    } catch (error) {
      console.warn('🍎 Safari History API fix: pushState failed', error);
      // Fallback: usar location.href como último recurso
      if (url && typeof url === 'string') {
        window.location.href = url;
      }
    }
  };

  history.replaceState = function(state, title, url) {
    try {
      originalReplaceState.call(history, state, title, url);
    } catch (error) {
      console.warn('🍎 Safari History API fix: replaceState failed', error);
    }
  };

  console.log('🍎 Safari History API fix aplicado');
};

/**
 * Função para lidar com erros de navegação no Safari
 */
export const handleSafariNavigationError = (error: Error, fallbackPath: string = '/'): void => {
  console.error('🍎 Erro de navegação no Safari:', error);
  
  // Tentar diferentes estratégias de recuperação
  try {
    // Estratégia 1: Usar window.location
    window.location.href = fallbackPath;
  } catch (locationError) {
    console.error('🍎 Fallback navigation também falhou:', locationError);
    
    // Estratégia 2: Recarregar a página
    try {
      window.location.reload();
    } catch (reloadError) {
      console.error('🍎 Reload também falhou:', reloadError);
    }
  }
};

/**
 * Verificar se o problema é relacionado ao react-router-dom
 */
export const isRouterRelatedError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';
  
  return (
    errorMessage.includes('router') ||
    errorMessage.includes('navigate') ||
    errorMessage.includes('history') ||
    errorStack.includes('react-router') ||
    errorStack.includes('router') ||
    errorStack.includes('browserrouter')
  );
};

/**
 * Inicializar todas as correções para Safari
 */
export const initSafariFixes = (): void => {
  if (isSafariIOS()) {
    console.log('🍎 Inicializando correções para Safari iOS...');
    initSafariHistoryFix();
    
    // Adicionar listener para erros não capturados
    window.addEventListener('error', (event) => {
      if (isRouterRelatedError(event.error)) {
        console.error('🍎 Erro de roteamento detectado:', event.error);
        // Não fazer nada aqui - deixar o ErrorBoundary lidar
      }
    });
    
    // Adicionar listener para promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && isRouterRelatedError(event.reason)) {
        console.error('🍎 Promise rejeitada relacionada ao router:', event.reason);
      }
    });
  }
};