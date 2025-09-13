// Debug específico para iPhone - Captura detalhada de erros
// Este script deve ser carregado antes de qualquer outro JavaScript

(function() {
    'use strict';
    
    // Detectar se é iPhone
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);
    
    // Array para armazenar logs
    window.iPhoneDebugLogs = [];
    
    // Função para adicionar log
    function addLog(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        window.iPhoneDebugLogs.push(logEntry);
        
        // Também logar no console
        console.log(`[iPhone Debug ${type.toUpperCase()}] ${message}`, data || '');
        
        // Tentar enviar para localStorage para persistir
        try {
            const existingLogs = JSON.parse(localStorage.getItem('iphone-debug-logs') || '[]');
            existingLogs.push(logEntry);
            // Manter apenas os últimos 50 logs
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }
            localStorage.setItem('iphone-debug-logs', JSON.stringify(existingLogs));
        } catch (e) {
            console.warn('Não foi possível salvar logs no localStorage:', e);
        }
    }
    
    // Log inicial com informações do dispositivo
    addLog('info', 'iPhone Debug iniciado', {
        isIPhone,
        isIOS,
        isSafari,
        isChrome,
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        },
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight
        },
        location: window.location.href
    });
    
    // Capturar erros JavaScript
    window.addEventListener('error', function(event) {
        addLog('error', 'JavaScript Error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.toString() : null,
            stack: event.error ? event.error.stack : null
        });
    });
    
    // Capturar erros de Promise rejeitadas
    window.addEventListener('unhandledrejection', function(event) {
        addLog('error', 'Unhandled Promise Rejection', {
            reason: event.reason,
            promise: event.promise
        });
    });
    
    // Capturar erros de recursos (imagens, scripts, etc.)
    window.addEventListener('error', function(event) {
        if (event.target !== window) {
            addLog('error', 'Resource Error', {
                tagName: event.target.tagName,
                src: event.target.src || event.target.href,
                message: 'Failed to load resource'
            });
        }
    }, true);
    
    // Monitorar mudanças de URL (para SPAs)
    let currentUrl = window.location.href;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        setTimeout(() => {
            if (window.location.href !== currentUrl) {
                addLog('navigation', 'URL Changed (pushState)', {
                    from: currentUrl,
                    to: window.location.href
                });
                currentUrl = window.location.href;
            }
        }, 0);
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        setTimeout(() => {
            if (window.location.href !== currentUrl) {
                addLog('navigation', 'URL Changed (replaceState)', {
                    from: currentUrl,
                    to: window.location.href
                });
                currentUrl = window.location.href;
            }
        }, 0);
    };
    
    window.addEventListener('popstate', function() {
        addLog('navigation', 'URL Changed (popstate)', {
            from: currentUrl,
            to: window.location.href
        });
        currentUrl = window.location.href;
    });
    
    // Monitorar carregamento de recursos
    window.addEventListener('load', function() {
        addLog('info', 'Window Load Complete');
    });
    
    // Monitorar DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addLog('info', 'DOM Content Loaded');
        });
    } else {
        addLog('info', 'DOM Already Loaded');
    }
    
    // Função para exibir logs (pode ser chamada no console)
    window.showIPhoneDebugLogs = function() {
        console.group('iPhone Debug Logs');
        window.iPhoneDebugLogs.forEach(log => {
            console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`, log.data || '');
        });
        console.groupEnd();
        
        // Também retornar os logs
        return window.iPhoneDebugLogs;
    };
    
    // Função para limpar logs
    window.clearIPhoneDebugLogs = function() {
        window.iPhoneDebugLogs = [];
        localStorage.removeItem('iphone-debug-logs');
        console.log('iPhone debug logs cleared');
    };
    
    // Função para exportar logs
    window.exportIPhoneDebugLogs = function() {
        const logs = JSON.stringify(window.iPhoneDebugLogs, null, 2);
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iphone-debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    // Monitorar performance
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const timing = window.performance.timing;
                addLog('performance', 'Page Load Timing', {
                    navigationStart: timing.navigationStart,
                    domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
                    loadEventEnd: timing.loadEventEnd,
                    domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                    pageLoadTime: timing.loadEventEnd - timing.navigationStart
                });
            }, 1000);
        });
    }
    
    // Detectar se a tela está branca
    function checkForWhiteScreen() {
        setTimeout(() => {
            const body = document.body;
            const root = document.getElementById('root');
            
            addLog('check', 'White Screen Check', {
                bodyChildren: body ? body.children.length : 0,
                rootChildren: root ? root.children.length : 0,
                bodyInnerHTML: body ? body.innerHTML.length : 0,
                rootInnerHTML: root ? root.innerHTML.length : 0,
                documentReadyState: document.readyState
            });
            
            // Se o root está vazio, pode ser tela branca
            if (root && root.children.length === 0) {
                addLog('warning', 'Possible White Screen Detected', {
                    rootElement: root,
                    rootHTML: root.innerHTML
                });
            }
        }, 2000);
    }
    
    // Verificar tela branca após carregamento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForWhiteScreen);
    } else {
        checkForWhiteScreen();
    }
    
    // Verificar novamente após um tempo
    setTimeout(checkForWhiteScreen, 5000);
    
    addLog('info', 'iPhone Debug script loaded successfully');
    
})();