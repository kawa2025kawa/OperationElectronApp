import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import electron from "vite-plugin-electron/simple";

import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import packageJson from "./package.json";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const resolvePath = (...paths: string[]): string =>
  path.resolve(rootDir, ...paths);

/**
 * Electron main process runtime dependencies.
 *
 * These modules must remain external because they are loaded
 * by Node/Electron at runtime.
 */
const electronRuntimeModules = [
  "axios",
  "express",
  "fs-extra",
  "keytar",
  "playwright",
  "playwright-core",
  "chromium-bidi",
  "puppeteer",
];

const isElectronExternal = (id: string): boolean =>
  electronRuntimeModules.some(
    (module) => id === module || id.startsWith(`${module}/`),
  );

export default defineConfig({
  /**
   * Renderer assets must use relative paths because
   * production is loaded through file://.
   */
  base: "./",

  clearScreen: false,

  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(packageJson.version),
  },

  plugins: [
    react(),

    vanillaExtractPlugin(),

    electron({
      /**
       * Electron Main Process
       *
       * electron/main.ts
       *        ↓
       * dist-electron/main.js
       */
      main: {
        entry: resolvePath("electron/main.ts"),

        vite: {
          build: {
            outDir: resolvePath("dist-electron"),

            target: "node22",

            rolldownOptions: {
              external: isElectronExternal,
            },

            rollupOptions: {
              output: {
                format: "es",
                entryFileNames: "main.js",
              },
            },
          },
        },
      },

      /**
       * Electron Preload
       *
       * electron/preload.ts
       *        ↓
       * dist-electron/preload.js
       *
       * Preload is intentionally built as CommonJS.
       */
      preload: {
        input: resolvePath("electron/preload.ts"),

        vite: {
          build: {
            outDir: resolvePath("dist-electron"),
            target: "node22",

            rollupOptions: {
              output: {
                format: "cjs",
                entryFileNames: "preload.cjs",
              },
            },
          },
        },
      },
    }),
  ],

  resolve: {
    alias: {
      "@renderer": resolvePath("src/renderer"),
      "@shared": resolvePath("src/shared"),
      "@electron": resolvePath("electron"),
      "@styles": resolvePath("src/renderer/styles"),
      "@resources": resolvePath("resources"),
    },
  },

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },

  build: {
    target: "esnext",
    outDir: resolvePath("dist"),
    emptyOutDir: true,
  },
});
