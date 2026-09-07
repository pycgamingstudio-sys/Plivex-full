import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aggressiveRootResolver = () => ({
  name: "aggressive-root-resolver",
  enforce: "pre",
  resolveId(source) {
    // अगर पैकेज या रिलेटिव इंपोर्ट नहीं है
    if (!source.startsWith(".") && !source.startsWith("/") && !source.startsWith("node_modules")) {
      const fileName = source.split("/").pop(); // रास्ते से सिर्फ असली फ़ाइल का नाम निकालता है
      const extensions = ["", ".jsx", ".js", ".tsx", ".ts", ".json"];

      for (const ext of extensions) {
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
  plugins: [aggressiveRootResolver(), react()],
  build: {
    outDir: "dist",
  },
});
