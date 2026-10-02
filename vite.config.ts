/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "src/routes",
        generatedRouteTree: "src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
    ],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      port: 5173,
      strictPort: true,
      // Same-origin API in development: cookies and CSRF origin checks behave as in production.
      proxy: {
        "/api": {
          target: env.DEV_API_PROXY_TARGET ?? "http://localhost:4000",
          changeOrigin: false,
        },
      },
    },
    // Hidden source maps: not referenced by the bundles; the Docker image deletes them.
    build: { sourcemap: "hidden" },
    // Unit tests for pure modules; browser journeys in e2e/ run under Playwright.
    test: { include: ["src/**/*.test.ts"], environment: "node" },
  };
});
