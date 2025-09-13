/**
 * Production iPhone Fix - Correções específicas para mdinheiro.com.br
 * Resolve problemas de tema e tela branca no iPhone em produção
 */

(function() {
    'use strict';
    
    // Detecta se é iPhone
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
    const isProduction = window.location.hostname === 'mdinheiro.com.br';
    const isLocalhost = window.location.hostname === 'localhost';
    
    if (!isIPhone) return;
    
    console.log('[Production iPhone Fix] Iniciando correções para iPhone');
    console.log('[Production iPhone Fix] Ambiente:', isProduction ? 'Produção' : 'Desenvolvimento');
    
    // Função para adicionar logs específicos
    function addProductionLog(level, message, data) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [Production iPhone Fix] ${message}`;
        
        console[level](logMessage, data || '');
        
        // Armazena logs para debug
        if (!window.productionLogs) window.productionLogs = [];
        window.productionLogs.push({ timestamp, level, message, data });
    }
    
    // Correção 1: Força tema correto baseado no sistema
    function fixThemeConflict() {
        addProductionLog('info', 'Corrigindo conflitos de tema');
        
        try {
            // Remove tema armazenado problemático
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme && storedTheme !== 'system') {
                addProductionLog('warn', 'Tema armazenado problemático detectado:', storedTheme);
                localStorage.removeItem('theme');
            }
            
            // Detecta tema do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            
            addProductionLog('info', 'Tema do sistema detectado:', systemTheme);
            
            // Aplica tema correto imediatamente
            document.documentElement.classList.remove('dark', 'light');
            document.documentElement.classList.add(systemTheme);
            
            // Define variáveis CSS corretas
            const root = document.documentElement;
            if (systemTheme === 'dark') {
                root.style.setProperty('--background', '222.2 84% 4.9%');
                root.style.setProperty('--foreground', '210 40% 98%');
            } else {
                root.style.setProperty('--background', '0 0% 100%');
                root.style.setProperty('--foreground', '222.2 84% 4.9%');
            }
            
            // Força repaint
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
            
            addProductionLog('success', 'Tema corrigido com sucesso');
            
        } catch (error) {
            addProductionLog('error', 'Erro ao corrigir tema:', error);
        }
    }
    
    // Correção 2: Limpa caches problemáticos em produção
    function clearProductionCaches() {
        addProductionLog('info', 'Limpando caches problemáticos');
        
        try {
            // Limpa localStorage problemático
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('theme') || key.includes('cache') || key.includes('state'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                addProductionLog('info', 'Removido do localStorage:', key);
            });
            
            // Limpa sessionStorage
            sessionStorage.clear();
            
            // Desabilita service workers problemáticos
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                        addProductionLog('info', 'Service Worker desregistrado');
                    });
                });
            }
            
            addProductionLog('success', 'Caches limpos com sucesso');
            
        } catch (error) {
            addProductionLog('error', 'Erro ao limpar caches:', error);
        }
    }
    
    // Correção 3: Previne tela branca após login
    function preventWhiteScreen() {
        addProductionLog('info', 'Configurando prevenção de tela branca');
        
        // Monitora mudanças de rota
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                addProductionLog('info', 'Mudança de rota detectada:', url);
                
                // Aplica correções após mudança de rota
                setTimeout(() => {
                    fixThemeConflict();
                    checkForWhiteScreen();
                }, 100);
            }
        }).observe(document, { subtree: true, childList: true });
        
        // Verifica tela branca periodicamente
        function checkForWhiteScreen() {
            const body = document.body;
            const root = document.getElementById('root');
            
            if (!root || !root.children.length || 
                getComputedStyle(body).backgroundColor === 'rgba(0, 0, 0, 0)') {
                
                addProductionLog('warn', 'Tela branca detectada, aplicando correções');
                
                // Força recarregamento do tema
                fixThemeConflict();
                
                // Força re-render do React
                if (window.React && window.ReactDOM) {
                    setTimeout(() => {
                        const event = new Event('resize');
                        window.dispatchEvent(event);
                    }, 50);
                }
            }
        }
        
        // Verifica a cada 2 segundos
        setInterval(checkForWhiteScreen, 2000);
    }
    
    // Correção 4: Otimizações específicas para produção
    function applyProductionOptimizations() {
        addProductionLog('info', 'Aplicando otimizações de produção');
        
        // Desabilita animações problemáticas no iPhone
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
                
                /* Força background correto */
                body, #root {
                    background-color: var(--background) !important;
                    color: var(--foreground) !important;
                }
                
                /* Previne zoom em inputs */
                input, select, textarea {
                    font-size: 16px !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Força modo standalone se for PWA
        if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('standalone-mode');
            addProductionLog('info', 'Modo standalone detectado');
        }
    }
    
    // Execução principal
    function initProductionFix() {
        addProductionLog('info', 'Iniciando correções de produção para iPhone');
        
        // Aplica correções imediatamente
        fixThemeConflict();
        clearProductionCaches();
        applyProductionOptimizations();
        
        // Configura monitoramento contínuo
        setTimeout(() => {
            preventWhiteScreen();
        }, 500);
        
        // Expõe funções para debug manual
        window.productionIPhoneFix = {
            fixTheme: fixThemeConflict,
            clearCaches: clearProductionCaches,
            checkWhiteScreen: () => checkForWhiteScreen(),
            getLogs: () => window.productionLogs || [],
            forceReload: () => {
                addProductionLog('info', 'Forçando recarregamento completo');
                window.location.reload(true);
            }
        };
        
        addProductionLog('success', 'Correções de produção inicializadas com sucesso');
    }
    
    // Inicia quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductionFix);
    } else {
        initProductionFix();
    }
    
    // Listener para mudanças de tema do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        addProductionLog('info', 'Mudança de tema do sistema detectada:', e.matches ? 'dark' : 'light');
        setTimeout(fixThemeConflict, 100);
    });
    
})();