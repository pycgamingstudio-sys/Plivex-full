import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootPathResolver = () => ({
  name: "root-path-resolver",
  enforce: "pre",
  resolveId(source) {
    // अगर इंपोर्ट रूट रिलेटिव (./ या ../) नहीं है और पैकेज इंपोर्ट नहीं है
    if (!source.startsWith(".") && !source.startsWith("/") && !source.startsWith("node_modules")) {
      const fileName = source.split("/").pop();
      const possibleExtensions = ["", ".jsx", ".js", ".ts", ".tsx", ".json"];

      for (const ext of possibleExtensions) {
        const fullPath = path.resolve(__dirname, `./${fileName}${ext}`);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
    return null;
  },
});

export default defineConfig({
  plugins: [rootPathResolver(), react()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
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
