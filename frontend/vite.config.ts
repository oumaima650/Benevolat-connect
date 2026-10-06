import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Configuration standard Vite + React + TanStack Router + Tailwind CSS v4
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tsconfigPaths(),
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 200,
      binaryInterval: 400,
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});

