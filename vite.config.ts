import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Para VPS e acesso via rede local: usar 0.0.0.0 para aceitar conexões externas
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    // Configuração HTTPS para desenvolvimento e produção
    https: mode === "production" ? {
      // Certificados SSL serão configurados pelo proxy reverso (nginx/traefik)
      // Esta configuração força HTTPS no desenvolvimento se necessário
    } : false, // Desabilitando HTTPS temporariamente para resolver problemas de SSL
    cors: {
      origin: mode === "production" 
        ? [process.env.VITE_APP_URL || "*"] 
        : "*",
      credentials: true
    },
    hmr: {
      // Configuração otimizada para iOS Safari/WebKit
      port: 24678,
      overlay: false,
      // Usar IP específico ao invés de localhost para iOS
      host: mode === "development" ? "0.0.0.0" : "localhost",
      // Protocolo WebSocket padrão para desenvolvimento
      protocol: "ws",
      // Configurações específicas para iOS
      clientPort: 24678,
      // Timeout aumentado para conexões iOS
      timeout: 60000,
      // Configurações adicionais para compatibilidade iOS
      skipSSLVerify: true
    },
    // Configurações adicionais para iOS Safari
    fs: {
      strict: false
    },
    // Headers específicos para iOS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: ["es2015", "safari11"],
    polyfillModulePreload: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@supabase/supabase-js"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
}));
