import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Para VPS: usar 0.0.0.0 para aceitar conexões externas
    host: mode === "production" ? "0.0.0.0" : "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    cors: {
      origin: mode === "production" 
        ? [process.env.VITE_APP_URL || "*"] 
        : true,
      credentials: true
    },
    hmr: {
      // Força polling em vez de WebSocket para iPhone
      port: 24678,
      overlay: false,
      // Para VPS: configurar host do HMR
      host: mode === "production" ? "0.0.0.0" : "localhost"
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
