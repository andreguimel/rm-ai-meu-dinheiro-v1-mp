import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { initSafariFixes } from "./utils/safari-router-fix";

// Inicializar correções para Safari antes de renderizar a aplicação
initSafariFixes();

// TEMPORARIAMENTE DESABILITADO - Sistema avançado de silenciamento de erros de extensões
// Para investigar tela branca, vamos permitir todos os logs
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Função para verificar se é erro de extensão
const isExtensionError = (message) => {
  // TEMPORARIAMENTE RETORNANDO FALSE PARA PERMITIR TODOS OS LOGS
  return false;

  // Código original comentado:
  /*
  // Verificar se contém ConstraintError e createObjectStore (padrão básico)
  const hasConstraintError =
    message.includes("ConstraintError") &&
    message.includes("createObjectStore");

  // Verificar padrões de extensão
  const hasExtensionPattern =
    message.includes("background?") ||
    message.includes("armor") ||
    message.includes("extension") ||
    message.includes("chrome-extension") ||
    message.includes("dps=armor") ||
    message.includes("Failed to execute") ||
    /background\?dps=armor.*[a-f0-9]{16}/.test(message) || // Padrão específico armor com hash
    message.includes("onupgradeneeded") ||
    message.includes("setIdbuuid") ||
    message.includes("doProfile");

  return hasConstraintError && hasExtensionPattern;
  */
};

// Interceptar todos os métodos de console
console.error = (...args) => {
  const message = args.join(" ");
  if (isExtensionError(message)) {
    // Silenciar completamente - não fazer nenhum log
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(" ");
  if (isExtensionError(message)) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.log = (...args) => {
  const message = args.join(" ");
  if (isExtensionError(message)) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

// Interceptar erros não tratados mais agressivamente
const suppressExtensionErrors = () => {
  // Sobrescrever o handler de erro padrão do navegador
  const originalOnerror = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === "string" && isExtensionError(message)) {
      return true; // Previne o log padrão
    }
    if (originalOnerror) {
      return originalOnerror(message, source, lineno, colno, error);
    }
    return false;
  };
};

// Aplicar supressão imediatamente
suppressExtensionErrors();

// Global error handler for browser extension errors
window.addEventListener("error", (event) => {
  const error = event.error;
  const filename = event.filename || "";

  const isExtensionError =
    filename.includes("background?") ||
    filename.includes("extension") ||
    filename.includes("chrome-extension") ||
    filename.includes("moz-extension") ||
    filename.includes("armor.") || // Específico para extensões de segurança
    error?.stack?.includes("background?") ||
    error?.stack?.includes("extension");

  const isIndexedDBError =
    error?.name === "ConstraintError" &&
    (error?.message?.includes("createObjectStore") ||
      error?.message?.includes("object store") ||
      error?.message?.includes("already exists"));

  const isDOMError =
    error?.name === "NotFoundError" &&
    (error?.message?.includes("removeChild") ||
      error?.message?.includes("Node was not found") ||
      error?.message?.includes("not a child of this node"));

  // Silenciar erros de IndexedDB vindos de extensões (incluindo quando não há stack trace)
  if (
    (isExtensionError && isIndexedDBError) ||
    (isIndexedDBError && filename.includes("armor"))
  ) {
    console.warn("🔇 Silenciando erro de IndexedDB de extensão do navegador:", {
      message: error?.message,
      filename: filename,
      timestamp: new Date().toISOString(),
    });
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  // Silenciar erros de DOM do React (removeChild)
  if (isDOMError) {
    console.warn("🔇 Silenciando erro de DOM do React:", {
      message: error?.message,
      filename: filename,
      timestamp: new Date().toISOString(),
    });
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  const isExtensionError =
    error?.stack?.includes("background?") ||
    error?.stack?.includes("extension") ||
    error?.stack?.includes("chrome-extension") ||
    error?.stack?.includes("moz-extension") ||
    error?.stack?.includes("armor."); // Específico para extensões de segurança

  const isIndexedDBError =
    error?.name === "ConstraintError" &&
    (error?.message?.includes("createObjectStore") ||
      error?.message?.includes("object store") ||
      error?.message?.includes("already exists"));

  // Silenciar rejeições de promise de IndexedDB vindas de extensões
  if (isExtensionError && isIndexedDBError) {
    console.warn("🔇 Silenciando promise rejection de IndexedDB de extensão:", {
      message: error?.message,
      timestamp: new Date().toISOString(),
    });
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
