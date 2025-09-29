import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory and its parent directories
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      // Make environment variables available in the client-side code
      "process.env": {},
    },
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
    // Ensure environment variables are loaded properly in production
    build: {
      target: "esnext",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
