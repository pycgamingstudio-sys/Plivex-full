import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// किसी भी नेस्टेड पाथ को काटकर सीधे फ़ाइल नेम निकालकर रूट से जोड़ने के लिए प्लगइन
const catchAllToRootPlugin = () => ({
  name: "catch-all-to-root",
  resolveId(source) {
    if (
      source.startsWith("@/") ||
      source.startsWith("src/") ||
      source.startsWith("lib/") ||
      source.startsWith("components/") ||
      source.startsWith("ui/")
    ) {
      const fileName = source.split("/").pop();
      return path.resolve(__dirname, `./${fileName}`);
    }
    return null;
  },
});

export default defineConfig({
  plugins: [catchAllToRootPlugin(), react()],
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
