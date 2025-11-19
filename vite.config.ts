import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/v1/, ""),
      },
    },
  },
  build: {
    sourcemap: mode === "development",
  },
  base: "/",
}));
