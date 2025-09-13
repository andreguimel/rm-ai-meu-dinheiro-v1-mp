// Fallback específico para iPhone - Soluções automáticas para problemas comuns
// Este script implementa soluções automáticas para problemas conhecidos do iPhone

(function () {
  "use strict";

  // Detectar se é iPhone
  const isIPhone = /iPhone/.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isChrome =
    /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);

  if (!isIOS) {
    console.log("iPhone Fallback: Não é um dispositivo iOS, saindo...");
    return;
  }

  console.log("iPhone Fallback: Iniciando sistema de fallback para iOS");

  // Configurações
  const config = {
    whiteScreenCheckDelay: 3000, // 3 segundos
    maxReloadAttempts: 2,
    reloadDelay: 2000, // 2 segundos
    fallbackTimeout: 10000, // 10 segundos
  };

  // Contador de tentativas de reload
  let reloadAttempts = parseInt(
    sessionStorage.getItem("iphone-reload-attempts") || "0"
  );

  // Função para adicionar log (se disponível)
  function log(type, message, data = null) {
    if (window.addLog) {
      window.addLog(type, `[Fallback] ${message}`, data);
    }
    console.log(
      `[iPhone Fallback ${type.toUpperCase()}] ${message}`,
      data || ""
    );
  }

  // Função para detectar tela branca
  function isWhiteScreen() {
    const root = document.getElementById("root");
    const body = document.body;

    // Verificar se o root existe e tem conteúdo
    if (!root) {
      log("warning", "Elemento root não encontrado");
      return true;
    }

    // Verificar se há conteúdo no root
    if (root.children.length === 0 && root.innerHTML.trim() === "") {
      log("warning", "Root está vazio");
      return true;
    }

    // Verificar se há elementos visíveis
    const visibleElements = root.querySelectorAll("*");
    let hasVisibleContent = false;

    for (let element of visibleElements) {
      const style = window.getComputedStyle(element);
      if (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      ) {
        hasVisibleContent = true;
        break;
      }
    }

    if (!hasVisibleContent) {
      log("warning", "Nenhum elemento visível encontrado");
      return true;
    }

    return false;
  }

  // Função para tentar corrigir problemas de CSS
  function fixCSSIssues() {
    log("info", "Tentando corrigir problemas de CSS");

    // Forçar re-render
    const root = document.getElementById("root");
    if (root) {
      root.style.display = "none";
      root.offsetHeight; // Trigger reflow
      root.style.display = "";
    }

    // Adicionar CSS de emergência
    const emergencyCSS = `
            #root {
                min-height: 100vh !important;
                width: 100% !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                min-height: 100vh !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            * {
                -webkit-transform: translateZ(0) !important;
                -webkit-backface-visibility: hidden !important;
            }
        `;

    const style = document.createElement("style");
    style.textContent = emergencyCSS;
    style.id = "iphone-emergency-css";
    document.head.appendChild(style);

    log("info", "CSS de emergência aplicado");
  }

  // Função para limpar cache
  function clearCache() {
    log("info", "Limpando cache do navegador");

    try {
      // Limpar localStorage
      const keysToKeep = ["iphone-reload-attempts", "iphone-debug-logs"];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Limpar sessionStorage (exceto contador de reload)
      const sessionKeysToKeep = ["iphone-reload-attempts"];
      const allSessionKeys = Object.keys(sessionStorage);

      allSessionKeys.forEach((key) => {
        if (!sessionKeysToKeep.includes(key)) {
          sessionStorage.removeItem(key);
        }
      });

      log("info", "Cache limpo com sucesso");
    } catch (error) {
      log("error", "Erro ao limpar cache", error);
    }
  }

  // Função para recarregar a página
  function reloadPage() {
    if (reloadAttempts >= config.maxReloadAttempts) {
      log("warning", "Máximo de tentativas de reload atingido");
      showFallbackMessage();
      return;
    }

    reloadAttempts++;
    sessionStorage.setItem("iphone-reload-attempts", reloadAttempts.toString());

    log(
      "info",
      `Recarregando página (tentativa ${reloadAttempts}/${config.maxReloadAttempts})`
    );

    setTimeout(() => {
      window.location.reload(true);
    }, config.reloadDelay);
  }

  // Função para mostrar mensagem de fallback
  function showFallbackMessage() {
    log("info", "Mostrando mensagem de fallback");

    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
                <div style="
                    padding: 20px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f5f5f5;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                ">
                    <h2 style="color: #333; margin-bottom: 20px;">🔄 Carregando...</h2>
                    <p style="color: #666; margin-bottom: 20px;">Estamos otimizando a experiência para seu iPhone.</p>
                    <button onclick="window.location.reload(true)" style="
                        background: #007AFF;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        margin: 10px;
                    ">Tentar Novamente</button>
                    <button onclick="window.clearIPhoneDebugLogs && window.clearIPhoneDebugLogs(); window.location.reload(true);" style="
                        background: #FF3B30;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        margin: 10px;
                    ">Limpar Cache e Recarregar</button>
                    <div style="margin-top: 20px; font-size: 12px; color: #999;">
                        Tentativas: ${reloadAttempts}/${config.maxReloadAttempts}
                    </div>
                </div>
            `;
    }
  }

  // Função principal de verificação
  function checkAndFix() {
    log("info", "Verificando se há problemas na página");

    setTimeout(() => {
      if (isWhiteScreen()) {
        log("warning", "Tela branca detectada, aplicando correções");

        // Tentar corrigir CSS primeiro
        fixCSSIssues();

        // Aguardar um pouco e verificar novamente
        setTimeout(() => {
          if (isWhiteScreen()) {
            log("warning", "Tela branca persiste, limpando cache");
            clearCache();

            // Aguardar mais um pouco e verificar novamente
            setTimeout(() => {
              if (isWhiteScreen()) {
                log("error", "Tela branca persiste, recarregando página");
                reloadPage();
              } else {
                log("success", "Problema resolvido após limpeza de cache");
                sessionStorage.removeItem("iphone-reload-attempts");
              }
            }, 2000);
          } else {
            log("success", "Problema resolvido após correção de CSS");
            sessionStorage.removeItem("iphone-reload-attempts");
          }
        }, 2000);
      } else {
        log("success", "Página carregada corretamente");
        sessionStorage.removeItem("iphone-reload-attempts");
      }
    }, config.whiteScreenCheckDelay);
  }

  // Função para monitorar mudanças no DOM
  function setupDOMObserver() {
    const root = document.getElementById("root");
    if (!root) {
      log("warning", "Root não encontrado para observação");
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let hasChanges = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        log("info", "Mudanças no DOM detectadas");
        // Se houve mudanças, a página provavelmente está funcionando
        sessionStorage.removeItem("iphone-reload-attempts");
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    log("info", "Observer do DOM configurado");
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupDOMObserver();
      checkAndFix();
    });
  } else {
    setupDOMObserver();
    checkAndFix();
  }

  // Timeout de segurança
  setTimeout(() => {
    if (isWhiteScreen()) {
      log("error", "Timeout atingido, página ainda com problemas");
      showFallbackMessage();
    }
  }, config.fallbackTimeout);

  log("info", "iPhone Fallback system initialized");
})();
