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
    
    // Função para forçar tema correto
    function forceCorrectTheme() {
        try {
            // Detecta tema real do sistema iOS
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            
            console.log('[iPhone Theme Override] Tema do sistema iOS:', systemTheme);
            
            // Remove qualquer tema armazenado que possa estar causando conflito
            localStorage.removeItem('theme');
            localStorage.removeItem('vite-ui-theme');
            sessionStorage.removeItem('theme');
            
            // Define o tema correto no localStorage
            localStorage.setItem('theme', systemTheme);
            
            // Aplica classes CSS imediatamente
            const html = document.documentElement;
            html.classList.remove('dark', 'light');
            html.classList.add(systemTheme);
            
            // Define atributo data-theme para compatibilidade
            html.setAttribute('data-theme', systemTheme);
            
            // Aplica variáveis CSS específicas do tema
            const root = document.documentElement;
            if (systemTheme === 'dark') {
                root.style.setProperty('--background', '222.2 84% 4.9%');
                root.style.setProperty('--foreground', '210 40% 98%');
                root.style.setProperty('--card', '222.2 84% 4.9%');
                root.style.setProperty('--card-foreground', '210 40% 98%');
                root.style.setProperty('--popover', '222.2 84% 4.9%');
                root.style.setProperty('--popover-foreground', '210 40% 98%');
                root.style.setProperty('--primary', '210 40% 98%');
                root.style.setProperty('--primary-foreground', '222.2 84% 4.9%');
                root.style.setProperty('--secondary', '217.2 32.6% 17.5%');
                root.style.setProperty('--secondary-foreground', '210 40% 98%');
                root.style.setProperty('--muted', '217.2 32.6% 17.5%');
                root.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
                root.style.setProperty('--accent', '217.2 32.6% 17.5%');
                root.style.setProperty('--accent-foreground', '210 40% 98%');
                root.style.setProperty('--destructive', '0 62.8% 30.6%');
                root.style.setProperty('--destructive-foreground', '210 40% 98%');
                root.style.setProperty('--border', '217.2 32.6% 17.5%');
                root.style.setProperty('--input', '217.2 32.6% 17.5%');
                root.style.setProperty('--ring', '212.7 26.8% 83.9%');
            } else {
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
            }
            
            // Força background do body
            document.body.style.backgroundColor = systemTheme === 'dark' ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)';
            document.body.style.color = systemTheme === 'dark' ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)';
            
            // Adiciona meta tag de theme-color
            let themeColorMeta = document.querySelector('meta[name="theme-color"]');
            if (themeColorMeta) {
                themeColorMeta.content = systemTheme === 'dark' ? '#0a0a0a' : '#ffffff';
            }
            
            console.log('[iPhone Theme Override] Tema aplicado com sucesso:', systemTheme);
            
            // Dispara evento customizado para notificar outros scripts
            window.dispatchEvent(new CustomEvent('iphone-theme-override', {
                detail: { theme: systemTheme }
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