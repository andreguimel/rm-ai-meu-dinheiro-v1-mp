import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 24678,
      host: "localhost",
      // Configurações para resolver erro "WebSocket not available: the operation is insecure"
      clientPort: mode === "development" ? 24678 : undefined,
    },
    // Configurações de segurança para WebSocket
    https: false, // Em desenvolvimento local, HTTP é aceitável
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
