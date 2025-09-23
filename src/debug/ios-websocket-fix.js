// Correção específica para problemas de WebSocket no iOS Safari
// Este script deve ser carregado antes de qualquer outro script que use WebSocket

(function() {
    'use strict';
    
    console.log('🔧 iOS WebSocket Fix iniciado');
    
    // Detectar se é iOS/Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isNetworkIP = window.location.hostname.includes('192.168') || 
                       window.location.hostname.includes('10.') ||
                       window.location.hostname.includes('172.');
    
    if (isIOS || isSafari) {
        console.log('📱 iOS/Safari detectado, aplicando correções WebSocket');
        
        // 1. Desabilitar WebSocket completamente para desenvolvimento via IP
        if (isNetworkIP && window.location.protocol === 'http:') {
            console.warn('⚠️ Desabilitando WebSocket para iOS via IP HTTP');
            
            // Substituir WebSocket por uma implementação vazia
            window.WebSocket = function() {
                console.warn('WebSocket desabilitado para iOS via IP');
                return {
                    readyState: 3, // CLOSED
                    close: function() {},
                    send: function() {},
                    addEventListener: function() {},
                    removeEventListener: function() {}
                };
            };
            
            // Constantes do WebSocket
            window.WebSocket.CONNECTING = 0;
            window.WebSocket.OPEN = 1;
            window.WebSocket.CLOSING = 2;
            window.WebSocket.CLOSED = 3;
        }
        
        // 2. Configurar Vite HMR para não usar WebSocket
        if (window.__vite_plugin_react_preamble_installed__) {
            console.log('🔄 Configurando Vite para iOS');
            
            // Desabilitar HMR WebSocket
            if (window.__vite__) {
                window.__vite__.ws = null;
            }
        }
        
        // 3. Interceptar tentativas de conexão WebSocket
        const originalWebSocket = window.WebSocket;
        if (originalWebSocket && isNetworkIP) {
            window.WebSocket = function(url, protocols) {
                console.warn('🚫 Tentativa de WebSocket interceptada:', url);
                
                // Para URLs de desenvolvimento, retornar mock
                if (url.includes('24678') || url.includes('ws://')) {
                    console.log('📡 Retornando WebSocket mock para desenvolvimento');
                    
                    const mockWS = {
                        readyState: 3, // CLOSED
                        url: url,
                        protocol: '',
                        extensions: '',
                        bufferedAmount: 0,
                        
                        close: function(code, reason) {
                            console.log('WebSocket mock closed');
                        },
                        
                        send: function(data) {
                            console.warn('WebSocket mock send ignorado:', data);
                        },
                        
                        addEventListener: function(type, listener) {
                            // Simular erro de conexão após um tempo
                            if (type === 'error') {
                                setTimeout(() => {
                                    listener(new Event('error'));
                                }, 100);
                            }
                        },
                        
                        removeEventListener: function() {},
                        
                        dispatchEvent: function() { return true; }
                    };
                    
                    // Simular falha de conexão
                    setTimeout(() => {
                        mockWS.readyState = 3; // CLOSED
                        if (mockWS.onerror) {
                            mockWS.onerror(new Event('error'));
                        }
                    }, 50);
                    
                    return mockWS;
                }
                
                // Para outras URLs, usar WebSocket original
                return new originalWebSocket(url, protocols);
            };
            
            // Copiar propriedades estáticas
            Object.keys(originalWebSocket).forEach(key => {
                window.WebSocket[key] = originalWebSocket[key];
            });
        }
        
        // 4. Configurar headers específicos para iOS
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Adicionar headers específicos para iOS
            const headers = {
                'User-Agent': navigator.userAgent,
                'X-iOS-Device': 'true',
                ...options.headers
            };
            
            return originalFetch(url, {
                ...options,
                headers
            });
        };
        
        // 5. Configurar timeout maior para requests
        const originalXMLHttpRequest = window.XMLHttpRequest;
        if (originalXMLHttpRequest) {
            window.XMLHttpRequest = function() {
                const xhr = new originalXMLHttpRequest();
                const originalOpen = xhr.open;
                
                xhr.open = function(method, url, async, user, password) {
                    originalOpen.call(this, method, url, async, user, password);
                    
                    // Timeout maior para iOS
                    if (isIOS) {
                        this.timeout = 30000; // 30 segundos
                    }
                };
                
                return xhr;
            };
            
            // Copiar propriedades
            Object.keys(originalXMLHttpRequest).forEach(key => {
                window.XMLHttpRequest[key] = originalXMLHttpRequest[key];
            });
        }
        
        console.log('✅ Correções WebSocket para iOS aplicadas');
    }
    
    // 6. Configurar meta tags específicas para iOS
    if (isIOS) {
        // Viewport otimizado
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
        
        // Adicionar meta tags específicas do iOS
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'format-detection', content: 'telephone=no' }
        ];
        
        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
    }
    
    // 7. Log de status final
    console.log('📊 Status das correções iOS:', {
        isIOS,
        isSafari,
        isNetworkIP,
        protocol: window.location.protocol,
        webSocketAvailable: !!window.WebSocket,
        userAgent: navigator.userAgent
    });
    
})();