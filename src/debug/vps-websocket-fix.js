/**
 * Correção específica para WebSocket na VPS com HTTPS
 * Resolve o erro "WebSocket not available: The operation is insecure"
 */

(function() {
    'use strict';
    
    console.log('🔧 VPS WebSocket Fix - Iniciando correções para produção HTTPS...');
    
    // Detectar se estamos em produção HTTPS
    const isHTTPS = window.location.protocol === 'https:';
    const isVPS = window.location.hostname.includes('mdinheiro.com.br') || 
                  window.location.hostname.includes('meu-dinheiro.com');
    
    if (isHTTPS && isVPS) {
        console.log('🌐 Ambiente VPS HTTPS detectado - Aplicando correções...');
        
        // 1. Desabilitar completamente WebSocket para HMR em produção
        if (window.WebSocket) {
            const originalWebSocket = window.WebSocket;
            
            window.WebSocket = function(url, protocols) {
                console.warn('🚫 WebSocket bloqueado em produção HTTPS:', url);
                
                // Simular WebSocket fechado imediatamente
                const mockSocket = {
                    readyState: 3, // CLOSED
                    close: function() {},
                    send: function() {},
                    addEventListener: function() {},
                    removeEventListener: function() {},
                    dispatchEvent: function() { return false; }
                };
                
                // Simular evento de erro após um pequeno delay
                setTimeout(() => {
                    if (mockSocket.onerror) {
                        mockSocket.onerror(new Event('error'));
                    }
                }, 100);
                
                return mockSocket;
            };
            
            // Copiar propriedades estáticas
            Object.setPrototypeOf(window.WebSocket, originalWebSocket);
            window.WebSocket.CONNECTING = 0;
            window.WebSocket.OPEN = 1;
            window.WebSocket.CLOSING = 2;
            window.WebSocket.CLOSED = 3;
        }
        
        // 2. Interceptar tentativas de conexão Vite HMR
        if (window.__vite_plugin_react_preamble_installed__) {
            console.log('🔄 Desabilitando Vite HMR em produção...');
            
            // Desabilitar hot reload
            if (window.__vite_plugin_react_preamble_installed__.updateQueue) {
                window.__vite_plugin_react_preamble_installed__.updateQueue = [];
            }
        }
        
        // 3. Configurar headers de segurança para WebSocket
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Adicionar headers de segurança para requests
            const headers = {
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                ...options.headers
            };
            
            return originalFetch(url, {
                ...options,
                headers
            });
        };
        
        // 4. Configurar meta tags específicas para HTTPS
        const metaTags = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            { 'http-equiv': 'Content-Security-Policy', content: "upgrade-insecure-requests" },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }
        ];
        
        metaTags.forEach(tag => {
            const existing = document.querySelector(`meta[name="${tag.name}"], meta[http-equiv="${tag['http-equiv']}"]`);
            if (!existing) {
                const meta = document.createElement('meta');
                Object.keys(tag).forEach(key => {
                    meta.setAttribute(key, tag[key]);
                });
                document.head.appendChild(meta);
            }
        });
        
        // 5. Interceptar erros de WebSocket e converter para avisos
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Converter erros de WebSocket em avisos menos críticos
            if (message.includes('WebSocket') && 
                (message.includes('insecure') || message.includes('not available'))) {
                console.warn('⚠️ WebSocket desabilitado em produção HTTPS (normal):', ...args);
                return;
            }
            
            // Outros erros passam normalmente
            originalConsoleError.apply(console, args);
        };
        
        // 6. Configurar Service Worker para cache offline
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('ℹ️ Service Worker não disponível:', err.message);
            });
        }
        
        // 7. Configurar timeout maior para requests em produção
        const originalXMLHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXMLHttpRequest();
            const originalOpen = xhr.open;
            
            xhr.open = function(method, url, async, user, password) {
                originalOpen.call(this, method, url, async, user, password);
                
                // Timeout maior para produção
                if (async !== false) {
                    this.timeout = 30000; // 30 segundos
                }
            };
            
            return xhr;
        };
        
        console.log('✅ VPS WebSocket Fix - Correções aplicadas com sucesso!');
        console.log('📱 Ambiente otimizado para produção HTTPS');
        
    } else {
        console.log('ℹ️ VPS WebSocket Fix - Não aplicável neste ambiente');
    }
    
    // 8. Configuração global para iOS Safari em HTTPS
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        console.log('📱 Aplicando correções específicas para iOS em HTTPS...');
        
        // Desabilitar zoom em inputs
        document.addEventListener('DOMContentLoaded', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
        });
        
        // Configurar armazenamento seguro para iOS
        try {
            localStorage.setItem('vps-https-test', 'ok');
            localStorage.removeItem('vps-https-test');
            console.log('✅ localStorage funcionando em HTTPS');
        } catch (e) {
            console.warn('⚠️ localStorage limitado em modo privado iOS');
        }
    }
    
})();