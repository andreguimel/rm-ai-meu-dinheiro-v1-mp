import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Configuração simplificada para melhor compatibilidade iOS
  define: {
    // Variáveis de ambiente estáticas para iOS
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(process.env.VITE_SUPABASE_PROJECT_ID || ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_ALLOW_TRIALS': JSON.stringify(process.env.VITE_ALLOW_TRIALS || 'true'),
    'import.meta.env.VITE_APP_URL': JSON.stringify(process.env.VITE_APP_URL || ''),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 24678,
      host: "localhost",
      clientPort: mode === "development" ? 24678 : undefined,
    },
    https: false,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build otimizado para iOS Safari
  build: {
    target: 'es2015', // Mais compatível com iOS Safari
    sourcemap: false, // Desabilitar source maps para iOS
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    // Otimizações para iOS
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },
  // Configurações específicas para iOS
  esbuild: {
    target: 'es2015',
    supported: {
      'top-level-await': false, // iOS Safari pode ter problemas
    },
  },
}));
