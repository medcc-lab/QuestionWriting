import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For Vite config, we use defineConfig which is evaluated at build time
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://backend:5000",
        changeOrigin: true,
      },
    },
  },
  envPrefix: "VITE_",
}));
