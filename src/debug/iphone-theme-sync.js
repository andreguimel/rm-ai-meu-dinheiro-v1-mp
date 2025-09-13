// iPhone Theme Synchronization - Corrige conflitos entre tema do iOS e da aplicação
// Criado para resolver problemas de tela branca causados por conflitos de tema

(function () {
  "use strict";

  console.log("🎨 iPhone Theme Sync - Iniciando correção de conflitos de tema");

  // Detectar se é iPhone
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent);

  if (!isIPhone) {
    console.log("📱 Não é iPhone - Theme Sync não necessário");
    return;
  }

  console.log("🍎 iPhone detectado - Iniciando sincronização de tema");

  // Função para detectar tema preferido do sistema
  function getSystemTheme() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }

  // Função para obter tema atual da aplicação
  function getCurrentAppTheme() {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      return "dark";
    }
    if (root.classList.contains("light")) {
      return "light";
    }
    return "system";
  }

  // Função para obter tema do localStorage
  function getStoredTheme() {
    try {
      return localStorage.getItem("theme") || "system";
    } catch (error) {
      console.warn("⚠️ Erro ao acessar localStorage para tema:", error);
      return "system";
    }
  }

  // Função para aplicar tema forçadamente
  function forceApplyTheme(theme) {
    const root = document.documentElement;

    // Remover classes existentes
    root.classList.remove("light", "dark");

    // Aplicar novo tema
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      root.classList.add(systemTheme);
      console.log(`🎨 Tema aplicado: system (${systemTheme})`);
    } else {
      root.classList.add(theme);
      console.log(`🎨 Tema aplicado: ${theme}`);
    }

    // Forçar repaint
    root.style.display = "none";
    root.offsetHeight; // Trigger reflow
    root.style.display = "";
  }

  // Função para sincronizar tema
  function syncTheme() {
    const systemTheme = getSystemTheme();
    const storedTheme = getStoredTheme();
    const currentAppTheme = getCurrentAppTheme();

    console.log("🔍 Estado atual dos temas:", {
      sistema: systemTheme,
      armazenado: storedTheme,
      aplicacao: currentAppTheme,
    });

    // Se o tema armazenado é 'system', sincronizar com o sistema
    if (storedTheme === "system") {
      if (currentAppTheme !== systemTheme) {
        console.log("🔄 Sincronizando tema system com iOS");
        forceApplyTheme("system");
      }
    } else {
      // Se há um tema específico armazenado, aplicá-lo
      if (currentAppTheme !== storedTheme) {
        console.log(`🔄 Aplicando tema armazenado: ${storedTheme}`);
        forceApplyTheme(storedTheme);
      }
    }
  }

  // Função para detectar mudanças no tema do sistema
  function setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      mediaQuery.addEventListener("change", (e) => {
        console.log(
          "🌓 Mudança detectada no tema do sistema:",
          e.matches ? "dark" : "light"
        );

        // Se o tema armazenado é 'system', sincronizar
        const storedTheme = getStoredTheme();
        if (storedTheme === "system") {
          setTimeout(() => {
            syncTheme();
          }, 100);
        }
      });
    }
  }

  // Função para detectar mudanças no localStorage
  function setupStorageListener() {
    window.addEventListener("storage", (e) => {
      if (e.key === "theme") {
        console.log("💾 Mudança detectada no tema armazenado:", e.newValue);
        setTimeout(() => {
          syncTheme();
        }, 100);
      }
    });
  }

  // Função para detectar mudanças no DOM
  function setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          const currentTheme = getCurrentAppTheme();
          console.log("🔄 Mudança detectada na classe do HTML:", currentTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Função para corrigir CSS específico do iPhone
  function applyIPhoneThemeFixes() {
    const style = document.createElement("style");
    style.id = "iphone-theme-fixes";
    style.textContent = `
            /* iPhone Theme Sync - Correções específicas */
            
            /* Garantir que o background seja aplicado corretamente */
            html, body {
                background-color: hsl(var(--background)) !important;
                color: hsl(var(--foreground)) !important;
                transition: background-color 0.3s ease, color 0.3s ease;
            }
            
            /* Corrigir viewport no iPhone */
            @supports (-webkit-touch-callout: none) {
                html {
                    -webkit-text-size-adjust: 100%;
                    -webkit-font-smoothing: antialiased;
                }
                
                body {
                    -webkit-overflow-scrolling: touch;
                }
            }
            
            /* Garantir que elementos com tema sejam visíveis */
            .dark *, .light * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            
            /* Corrigir possíveis elementos invisíveis */
            .dark [style*="color: transparent"],
            .light [style*="color: transparent"] {
                color: hsl(var(--foreground)) !important;
            }
            
            /* Garantir visibilidade de texto */
            .dark .text-transparent,
            .light .text-transparent {
                color: hsl(var(--foreground)) !important;
            }
        `;

    // Remover estilo anterior se existir
    const existingStyle = document.getElementById("iphone-theme-fixes");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);
    console.log("🎨 Correções CSS específicas do iPhone aplicadas");
  }

  // Função para verificar se há elementos invisíveis
  function checkInvisibleElements() {
    const invisibleElements = [];
    const allElements = document.querySelectorAll("*");

    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        style.color === "transparent" ||
        style.backgroundColor === "transparent" ||
        style.opacity === "0" ||
        style.visibility === "hidden"
      ) {
        invisibleElements.push(el);
      }
    });

    if (invisibleElements.length > 0) {
      console.warn(
        "⚠️ Elementos potencialmente invisíveis encontrados:",
        invisibleElements.length
      );
      return invisibleElements;
    }

    return [];
  }

  // Função principal de inicialização
  function initThemeSync() {
    console.log("🚀 Inicializando iPhone Theme Sync");

    // Aplicar correções CSS
    applyIPhoneThemeFixes();

    // Sincronizar tema inicial
    syncTheme();

    // Configurar listeners
    setupSystemThemeListener();
    setupStorageListener();
    setupDOMObserver();

    // Verificar elementos invisíveis
    setTimeout(() => {
      checkInvisibleElements();
    }, 1000);

    // Sincronização periódica (fallback)
    setInterval(() => {
      syncTheme();
    }, 5000);

    console.log("✅ iPhone Theme Sync configurado com sucesso");
  }

  // Função para debug manual
  window.iPhoneThemeDebug = {
    sync: syncTheme,
    getSystemTheme,
    getCurrentAppTheme,
    getStoredTheme,
    forceApplyTheme,
    checkInvisibleElements,
    info: () => {
      return {
        isIPhone,
        systemTheme: getSystemTheme(),
        storedTheme: getStoredTheme(),
        currentAppTheme: getCurrentAppTheme(),
        invisibleElements: checkInvisibleElements().length,
      };
    },
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeSync);
  } else {
    initThemeSync();
  }

  console.log(
    "🎨 iPhone Theme Sync carregado - Use window.iPhoneThemeDebug para debug"
  );
})();
