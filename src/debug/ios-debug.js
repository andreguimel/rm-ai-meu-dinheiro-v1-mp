// Debug script para identificar problemas no iOS/Safari
// Execute este script no console do Safari no iPhone

console.log('🔍 iOS Debug Script iniciado');

// 1. Verificar compatibilidade básica
const checkBasicCompatibility = () => {
  console.log('📱 === VERIFICAÇÃO DE COMPATIBILIDADE BÁSICA ===');
  
  // Verificar localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ localStorage: OK');
  } catch (e) {
    console.error('❌ localStorage: FALHOU', e);
  }
  
  // Verificar sessionStorage
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    console.log('✅ sessionStorage: OK');
  } catch (e) {
    console.error('❌ sessionStorage: FALHOU', e);
  }
  
  // Verificar fetch API
  if (typeof fetch !== 'undefined') {
    console.log('✅ fetch API: OK');
  } else {
    console.error('❌ fetch API: NÃO DISPONÍVEL');
  }
  
  // Verificar Promise
  if (typeof Promise !== 'undefined') {
    console.log('✅ Promise: OK');
  } else {
    console.error('❌ Promise: NÃO DISPONÍVEL');
  }
  
  // Verificar async/await
  try {
    eval('(async () => {})');
    console.log('✅ async/await: OK');
  } catch (e) {
    console.error('❌ async/await: FALHOU', e);
  }
};

// 2. Verificar estado da aplicação
const checkAppState = () => {
  console.log('🔍 === VERIFICAÇÃO DO ESTADO DA APLICAÇÃO ===');
  
  // Verificar se React está carregado
  if (typeof React !== 'undefined') {
    console.log('✅ React: Carregado');
  } else {
    console.error('❌ React: NÃO CARREGADO');
  }
  
  // Verificar se há elementos React na página
  const reactElements = document.querySelectorAll('[data-reactroot], #root');
  console.log(`📊 Elementos React encontrados: ${reactElements.length}`);
  
  // Verificar se há erros JavaScript
  console.log('🔍 Verificando erros JavaScript...');
  window.addEventListener('error', (e) => {
    console.error('❌ ERRO JAVASCRIPT:', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error
    });
  });
  
  // Verificar erros de Promise rejeitadas
  window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ PROMISE REJEITADA:', e.reason);
  });
};

// 3. Verificar autenticação Supabase
const checkSupabaseAuth = async () => {
  console.log('🔐 === VERIFICAÇÃO DE AUTENTICAÇÃO SUPABASE ===');
  
  try {
    // Verificar se supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client não encontrado');
      return;
    }
    
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
    } else if (session) {
      console.log('✅ Sessão ativa:', {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: new Date(session.expires_at * 1000)
      });
    } else {
      console.log('ℹ️ Nenhuma sessão ativa');
    }
    
    // Verificar usuário atual
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
    } else if (user) {
      console.log('✅ Usuário autenticado:', {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      });
    } else {
      console.log('ℹ️ Usuário não autenticado');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação Supabase:', error);
  }
};

// 4. Verificar roteamento React Router
const checkRouting = () => {
  console.log('🛣️ === VERIFICAÇÃO DE ROTEAMENTO ===');
  
  // Verificar URL atual
  console.log('📍 URL atual:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  console.log('📍 Hash:', window.location.hash);
  
  // Verificar se React Router está funcionando
  const routerElements = document.querySelectorAll('[data-testid*="router"], [class*="router"]');
  console.log(`🛣️ Elementos de roteamento encontrados: ${routerElements.length}`);
  
  // Verificar histórico do navegador
  console.log('📚 Histórico do navegador:', {
    length: window.history.length,
    state: window.history.state
  });
};

// 5. Verificar CSS e renderização
const checkRendering = () => {
  console.log('🎨 === VERIFICAÇÃO DE RENDERIZAÇÃO ===');
  
  // Verificar se há elementos visíveis
  const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
  
  console.log(`👁️ Elementos visíveis: ${visibleElements.length}`);
  
  // Verificar se há elementos com altura/largura
  const elementsWithSize = Array.from(document.querySelectorAll('*')).filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  
  console.log(`📏 Elementos com tamanho: ${elementsWithSize.length}`);
  
  // Verificar viewport
  console.log('📱 Viewport:', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  });
  
  // Verificar se há CSS carregado
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
  console.log(`🎨 Folhas de estilo carregadas: ${stylesheets.length}`);
};

// 6. Verificar console de erros
const checkConsoleErrors = () => {
  console.log('🚨 === VERIFICAÇÃO DE ERROS NO CONSOLE ===');
  
  // Capturar erros futuros
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    console.log('🔴 ERRO CAPTURADO:', args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    console.log('🟡 AVISO CAPTURADO:', args);
    originalWarn.apply(console, args);
  };
  
  console.log('✅ Captura de erros ativada');
};

// 7. Função principal de debug
const runIOSDebug = async () => {
  console.log('🚀 === INICIANDO DEBUG COMPLETO PARA iOS ===');
  
  checkBasicCompatibility();
  checkAppState();
  await checkSupabaseAuth();
  checkRouting();
  checkRendering();
  checkConsoleErrors();
  
  console.log('✅ === DEBUG COMPLETO FINALIZADO ===');
  console.log('📋 Copie todos os logs acima e envie para análise');
};

// Executar debug automaticamente
runIOSDebug();

// Disponibilizar funções globalmente para uso manual
window.iosDebug = {
  runFull: runIOSDebug,
  checkCompatibility: checkBasicCompatibility,
  checkApp: checkAppState,
  checkAuth: checkSupabaseAuth,
  checkRouting: checkRouting,
  checkRendering: checkRendering,
  checkErrors: checkConsoleErrors
};

console.log('🔧 Funções de debug disponíveis em window.iosDebug');
console.log('💡 Use window.iosDebug.runFull() para executar debug completo novamente');