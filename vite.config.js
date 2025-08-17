import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist-frontend",
  },
  server: {
    port: 5173,
    proxy: {
      "/query": { target: "http://backend:3000", changeOrigin: true },
      "/health": { target: "http://backend:3000", changeOrigin: true },
      "/sample-questions": {
        target: "http://backend:3000",
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
