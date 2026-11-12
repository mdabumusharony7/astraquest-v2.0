import { cpSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const htmlPages = readdirSync(root).filter((file) => file.endsWith(".html"));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-static-assets",
      writeBundle() {
        cpSync(resolve(root, "assets"), resolve(root, "dist/assets"), {
          recursive: true,
        });
        cpSync(resolve(root, "js"), resolve(root, "dist/js"), {
          recursive: true,
        });
      },
    },
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        htmlPages.map((file) => [basename(file, ".html"), resolve(root, file)]),
      ),
    },
  },
});
