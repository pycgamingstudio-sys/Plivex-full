import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "src": path.resolve(__dirname, "./"),
      "lib": path.resolve(__dirname, "./"),
      "components": path.resolve(__dirname, "./"),
      "ui": path.resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: "dist",
  },
});
