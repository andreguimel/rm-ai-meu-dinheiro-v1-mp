/**
 * iPhone Production Theme Override
 * Força o tema correto no iPhone para mdinheiro.com.br
 * Resolve o problema de inicialização no modo escuro quando o sistema está no modo claro
 */

(function() {
    'use strict';
    
    // Só executa no iPhone
    if (!/iPhone|iPod/.test(navigator.userAgent)) return;
    
    console.log('[iPhone Theme Override] Iniciando override de tema para produção');
    
    // Função principal para forçar APENAS o modo claro
    function forceCorrectTheme() {
        try {
            console.log('[iPhone Theme Override] Forçando APENAS modo claro');
            
            // Remove qualquer tema armazenado que possa estar causando conflito
            localStorage.removeItem('theme');
            localStorage.removeItem('vite-ui-theme');
            localStorage.removeItem('theme-dark');
            sessionStorage.removeItem('theme');
            sessionStorage.removeItem('theme-dark');
            
            // Define APENAS o tema claro no localStorage
            localStorage.setItem('theme', 'light');
            
            // Aplica classes CSS imediatamente - APENAS modo claro
            const html = document.documentElement;
            html.classList.remove('dark', 'light');
            html.classList.add('light');
            
            // Define atributo data-theme para compatibilidade
            html.setAttribute('data-theme', 'light');
            
            // Aplica variáveis CSS APENAS para modo claro
            const root = document.documentElement;
            root.style.setProperty('--background', '0 0% 100%');
            root.style.setProperty('--foreground', '222.2 84% 4.9%');
            root.style.setProperty('--card', '0 0% 100%');
            root.style.setProperty('--card-foreground', '222.2 84% 4.9%');
            root.style.setProperty('--popover', '0 0% 100%');
            root.style.setProperty('--popover-foreground', '222.2 84% 4.9%');
            root.style.setProperty('--primary', '222.2 47.4% 11.2%');
            root.style.setProperty('--primary-foreground', '210 40% 98%');
            root.style.setProperty('--secondary', '210 40% 96%');
            root.style.setProperty('--secondary-foreground', '222.2 84% 4.9%');
            root.style.setProperty('--muted', '210 40% 96%');
            root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
            root.style.setProperty('--accent', '210 40% 96%');
            root.style.setProperty('--accent-foreground', '222.2 84% 4.9%');
            root.style.setProperty('--destructive', '0 84.2% 60.2%');
            root.style.setProperty('--destructive-foreground', '210 40% 98%');
            root.style.setProperty('--border', '214.3 31.8% 91.4%');
            root.style.setProperty('--input', '214.3 31.8% 91.4%');
            root.style.setProperty('--ring', '222.2 84% 4.9%');
            
            // Força background do body para modo claro
            document.body.style.backgroundColor = 'hsl(0 0% 100%)';
            document.body.style.color = 'hsl(222.2 84% 4.9%)';
            
            // Adiciona meta tag de theme-color para branco
            let themeColorMeta = document.querySelector('meta[name="theme-color"]');
            if (themeColorMeta) {
                themeColorMeta.content = '#ffffff';
            }
            
            console.log('[iPhone Theme Override] Modo claro aplicado com sucesso - modo dark desabilitado');
            
            // Dispara evento customizado para notificar outros scripts
            window.dispatchEvent(new CustomEvent('iphone-theme-override', {
                detail: { theme: 'light' }
            }));
            
        } catch (error) {
            console.error('[iPhone Theme Override] Erro ao aplicar tema:', error);
        }
    }
    
    // Aplica tema imediatamente
    forceCorrectTheme();
    
    // Reaplica quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceCorrectTheme);
    }
    
    // Reaplica quando a página estiver totalmente carregada
    window.addEventListener('load', forceCorrectTheme);
    
    // Monitora mudanças no tema do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        console.log('[iPhone Theme Override] Mudança de tema do sistema detectada');
        setTimeout(forceCorrectTheme, 100);
    });
    
    // Monitora mudanças no localStorage que possam afetar o tema
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            console.log('[iPhone Theme Override] Mudança no localStorage detectada');
            setTimeout(forceCorrectTheme, 100);
        }
    });
    
    // Expõe função para debug manual
    window.iPhoneThemeOverride = {
        forceTheme: forceCorrectTheme,
        getCurrentTheme: () => {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : 'light';
        },
        getStoredTheme: () => localStorage.getItem('theme'),
        resetTheme: () => {
            localStorage.removeItem('theme');
            sessionStorage.removeItem('theme');
            forceCorrectTheme();
        }
    };
    
    console.log('[iPhone Theme Override] Override de tema inicializado com sucesso');
    
})();