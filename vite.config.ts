import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  optimizeDeps: {
    include: ['buffer']
  },
  define: {
    'process.env': '{}',
    global: 'globalThis',
  },
});
