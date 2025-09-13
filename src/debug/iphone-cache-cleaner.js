// iPhone Cache Cleaner - Remove caches problemáticos e service workers
// Este script força a limpeza de todos os caches que podem causar tela branca no iPhone

(function () {
  "use strict";

  // Detectar se é iPhone/iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!isIOS) {
    console.log("Cache Cleaner: Não é um dispositivo iOS, saindo...");
    return;
  }

  console.log("iPhone Cache Cleaner: Iniciando limpeza de caches...");

  // Função para log
  function log(type, message, data = null) {
    if (window.addLog) {
      window.addLog(type, `[Cache Cleaner] ${message}`, data);
    }
    console.log(
      `[iPhone Cache Cleaner ${type.toUpperCase()}] ${message}`,
      data || ""
    );
  }

  // 1. Desregistrar todos os service workers
  async function unregisterServiceWorkers() {
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (registrations.length > 0) {
          log(
            "info",
            `Encontrados ${registrations.length} service workers, desregistrando...`
          );

          for (let registration of registrations) {
            await registration.unregister();
            log("success", "Service worker desregistrado", registration.scope);
          }
        } else {
          log("info", "Nenhum service worker encontrado");
        }
      } catch (error) {
        log("error", "Erro ao desregistrar service workers", error);
      }
    } else {
      log("info", "Service Worker não suportado neste navegador");
    }
  }

  // 2. Limpar todos os caches da Cache API
  async function clearCacheAPI() {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();

        if (cacheNames.length > 0) {
          log("info", `Encontrados ${cacheNames.length} caches, limpando...`);

          for (let cacheName of cacheNames) {
            await caches.delete(cacheName);
            log("success", "Cache removido", cacheName);
          }
        } else {
          log("info", "Nenhum cache encontrado na Cache API");
        }
      } catch (error) {
        log("error", "Erro ao limpar Cache API", error);
      }
    } else {
      log("info", "Cache API não suportada neste navegador");
    }
  }

  // 3. Limpar localStorage (mantendo apenas logs de debug)
  function clearLocalStorage() {
    try {
      const keysToKeep = ["iphone-debug-logs", "iphone-reload-attempts"];

      const allKeys = Object.keys(localStorage);
      let removedCount = 0;

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });

      log("success", `localStorage limpo: ${removedCount} itens removidos`);
    } catch (error) {
      log("error", "Erro ao limpar localStorage", error);
    }
  }

  // 4. Limpar sessionStorage (mantendo apenas contador de reload)
  function clearSessionStorage() {
    try {
      const keysToKeep = ["iphone-reload-attempts"];

      const allKeys = Object.keys(sessionStorage);
      let removedCount = 0;

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          sessionStorage.removeItem(key);
          removedCount++;
        }
      });

      log("success", `sessionStorage limpo: ${removedCount} itens removidos`);
    } catch (error) {
      log("error", "Erro ao limpar sessionStorage", error);
    }
  }

  // 5. Limpar IndexedDB
  async function clearIndexedDB() {
    if ("indexedDB" in window) {
      try {
        // Tentar obter lista de databases (nem todos os navegadores suportam)
        if (indexedDB.databases) {
          const databases = await indexedDB.databases();

          if (databases.length > 0) {
            log(
              "info",
              `Encontrados ${databases.length} IndexedDB, limpando...`
            );

            for (let db of databases) {
              if (db.name) {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                await new Promise((resolve, reject) => {
                  deleteReq.onsuccess = () => {
                    log("success", "IndexedDB removido", db.name);
                    resolve();
                  };
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            }
          } else {
            log("info", "Nenhum IndexedDB encontrado");
          }
        } else {
          log("info", "Não é possível listar IndexedDB neste navegador");
        }
      } catch (error) {
        log("error", "Erro ao limpar IndexedDB", error);
      }
    } else {
      log("info", "IndexedDB não suportado neste navegador");
    }
  }

  // 6. Forçar limpeza de cache do navegador via meta tags
  function addNoCacheHeaders() {
    // Adicionar meta tags para prevenir cache
    const metaTags = [
      { name: "cache-control", content: "no-cache, no-store, must-revalidate" },
      { name: "pragma", content: "no-cache" },
      { name: "expires", content: "0" },
    ];

    metaTags.forEach((tag) => {
      const existing = document.querySelector(`meta[http-equiv="${tag.name}"]`);
      if (!existing) {
        const meta = document.createElement("meta");
        meta.httpEquiv = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
        log("info", `Meta tag adicionada: ${tag.name}`);
      }
    });
  }

  // 7. Limpar cookies relacionados à aplicação
  function clearAppCookies() {
    try {
      const cookies = document.cookie.split(";");
      let removedCount = 0;

      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        // Remover cookies que podem causar problemas
        if (name && !name.startsWith("_ga") && !name.startsWith("_gid")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          removedCount++;
        }
      });

      log("success", `Cookies limpos: ${removedCount} cookies removidos`);
    } catch (error) {
      log("error", "Erro ao limpar cookies", error);
    }
  }

  // Função principal de limpeza
  async function performFullCleanup() {
    log("info", "Iniciando limpeza completa de caches...");

    try {
      // Executar limpezas em paralelo quando possível
      await Promise.all([
        unregisterServiceWorkers(),
        clearCacheAPI(),
        clearIndexedDB(),
      ]);

      // Executar limpezas síncronas
      clearLocalStorage();
      clearSessionStorage();
      clearAppCookies();
      addNoCacheHeaders();

      log("success", "Limpeza completa de caches finalizada");

      // Marcar que a limpeza foi feita
      sessionStorage.setItem("iphone-cache-cleaned", "true");
    } catch (error) {
      log("error", "Erro durante limpeza de caches", error);
    }
  }

  // Função para verificar se precisa limpar cache
  function shouldCleanCache() {
    // Verificar se já foi limpo nesta sessão
    if (sessionStorage.getItem("iphone-cache-cleaned")) {
      log("info", "Cache já foi limpo nesta sessão");
      return false;
    }

    // Verificar se há problemas conhecidos
    const hasProblems =
      // Verificar se há service workers registrados
      "serviceWorker" in navigator ||
      // Verificar se há muitos itens no localStorage
      Object.keys(localStorage).length > 10 ||
      // Verificar se há cookies suspeitos
      document.cookie.length > 500;

    return hasProblems;
  }

  // Expor função para limpeza manual
  window.cleanIPhoneCache = performFullCleanup;

  // Executar limpeza automática se necessário
  if (shouldCleanCache()) {
    log(
      "info",
      "Problemas de cache detectados, executando limpeza automática..."
    );
    performFullCleanup();
  } else {
    log("info", "Nenhum problema de cache detectado");
  }

  // Executar limpeza quando a página for descarregada (para próxima visita)
  window.addEventListener("beforeunload", () => {
    // Limpeza rápida antes de sair
    try {
      sessionStorage.removeItem("iphone-cache-cleaned");
    } catch (e) {
      // Ignorar erros
    }
  });

  log("info", "iPhone Cache Cleaner inicializado");
})();
