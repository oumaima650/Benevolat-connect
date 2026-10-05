import { defineConfig } from "vite";
import pluginReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    pluginReact(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": "/src",
    },
  },
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
