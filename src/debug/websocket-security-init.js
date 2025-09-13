/**
 * Script de inicialização para WebSocket seguro
 * Deve ser carregado antes de outros scripts para garantir configuração correta
 */

(function() {
  'use strict';
  
  console.log('🔒 Inicializando configurações de WebSocket seguro...');
  
  // Detectar ambiente
  const isProduction = window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1';
  const isHTTPS = window.location.protocol === 'https:';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  // Configurações globais
  window.__websocketSecurity = {
    isProduction,
    isHTTPS,
    isIOS,
    isSafari,
    forcePolling: false,
    disableWebSocket: false,
    initialized: true
  };
  
  // Verificar se deve forçar polling (configuração salva)
  try {
    const forcePolling = localStorage.getItem('__force_polling') === 'true';
    const websocketFallback = localStorage.getItem('__websocket_fallback') === 'true';
    
    if (forcePolling || websocketFallback) {
      console.log('📡 Configuração de polling detectada, aplicando...');
      window.__websocketSecurity.forcePolling = true;
      
      if (websocketFallback) {
        window.__websocketSecurity.disableWebSocket = true;
      }
    }
  } catch (e) {
    console.warn('Erro ao verificar configurações salvas:', e);
  }
  
  // Função para interceptar criação de WebSocket
  const originalWebSocket = window.WebSocket;
  
  if (originalWebSocket && !window.__websocketSecurity.disableWebSocket) {
    window.WebSocket = function(url, protocols) {
      console.log('🔌 Interceptando criação de WebSocket:', url);
      
      // Verificar se deve usar polling
      if (window.__websocketSecurity.forcePolling) {
        console.log('📡 Forçando polling em vez de WebSocket');
        throw new Error('WebSocket desabilitado - usando polling');
      }
      
      // Corrigir URL para usar protocolo seguro
      let secureUrl = url;
      
      if (isProduction && isHTTPS && url.startsWith('ws://')) {
        // Em produção HTTPS, garantir que usa WSS com regex mais robusta
        secureUrl = url.replace(/^ws:/, 'wss:');
        console.log('🔒 Convertendo para WSS:', secureUrl);
      }
      
      // Criar WebSocket com URL corrigida
      try {
        const ws = new originalWebSocket(secureUrl, protocols);
        
        // Adicionar logs para debug
        ws.addEventListener('open', () => {
          console.log('✅ WebSocket conectado:', secureUrl);
        });
        
        ws.addEventListener('error', (error) => {
          console.error('❌ Erro no WebSocket:', error);
          
          // Se é iOS e falhou, sugerir polling
          if (isIOS || isSafari) {
            console.log('🍎 Erro no iOS/Safari - considere usar polling');
            localStorage.setItem('__websocket_error_ios', 'true');
          }
        });
        
        ws.addEventListener('close', (event) => {
          console.log('🔌 WebSocket fechado:', event.code, event.reason);
        });
        
        return ws;
      } catch (error) {
        console.error('❌ Falha ao criar WebSocket:', error);
        
        // Se é iOS, salvar erro para fallback automático
        if (isIOS || isSafari) {
          localStorage.setItem('__websocket_fallback', 'true');
          localStorage.setItem('__force_polling', 'true');
        }
        
        throw error;
      }
    };
    
    // Preservar propriedades do WebSocket original
    Object.setPrototypeOf(window.WebSocket, originalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: originalWebSocket.prototype,
      writable: false
    });
    
    // Copiar constantes
    window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = originalWebSocket.OPEN;
    window.WebSocket.CLOSING = originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = originalWebSocket.CLOSED;
  }
  
  // Função para testar conectividade
  window.__testWebSocket = function(url) {
    return new Promise((resolve) => {
      if (window.__websocketSecurity.disableWebSocket) {
        resolve(false);
        return;
      }
      
      try {
        const testUrl = url || (isHTTPS ? 'wss://' : 'ws://') + window.location.host + '/ws';
        const ws = new originalWebSocket(testUrl);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);
        
        ws.addEventListener('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        });
        
        ws.addEventListener('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  };
  
  // Função para forçar polling
  window.__forcePolling = function() {
    console.log('📡 Forçando modo polling');
    window.__websocketSecurity.forcePolling = true;
    localStorage.setItem('__force_polling', 'true');
    localStorage.setItem('__websocket_fallback', 'true');
  };
  
  // Função para restaurar WebSocket
  window.__restoreWebSocket = function() {
    console.log('🔌 Restaurando WebSocket');
    window.__websocketSecurity.forcePolling = false;
    window.__websocketSecurity.disableWebSocket = false;
    localStorage.removeItem('__force_polling');
    localStorage.removeItem('__websocket_fallback');
    localStorage.removeItem('__websocket_error_ios');
  };
  
  // Log de inicialização
  console.log('🔒 WebSocket Security configurado:', {
    isProduction,
    isHTTPS,
    isIOS,
    isSafari,
    forcePolling: window.__websocketSecurity.forcePolling,
    disableWebSocket: window.__websocketSecurity.disableWebSocket
  });
  
  // Verificação automática para iOS
  if ((isIOS || isSafari) && isProduction && !isHTTPS) {
    console.warn('⚠️ iOS/Safari em produção HTTP - WebSocket pode falhar');
    console.log('💡 Considere usar HTTPS ou ativar polling');
  }
  
})();