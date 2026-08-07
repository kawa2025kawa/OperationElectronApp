// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import electron from "vite-plugin-electron/simple";

import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const resolvePath = (...paths: string[]): string =>
  path.resolve(rootDir, ...paths);

/**
 * Electron main process runtime dependencies.
 *
 * These modules are required at runtime and should not be bundled.
 */
const electronRuntimeModules = [
  // Node / Electron runtime modules
  "axios",
  "express",
  "fs-extra",
  "keytar",

  // Browser automation
  "playwright",
  "playwright-core",
  "chromium-bidi",
  "puppeteer",
];

/**
 * External resolver for Rollup / Rolldown.
 *
 * Supports:
 * - playwright
 * - playwright/*
 * - playwright-core/*
 * - chromium-bidi/*
 */
const isElectronExternal = (id: string): boolean =>
  electronRuntimeModules.some(
    (module) => id === module || id.startsWith(`${module}/`),
  );

export default defineConfig({
  base: "./",

  clearScreen: false,

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

            rolldownOptions: {
              external: isElectronExternal,
            },

            rollupOptions: {
              output: {
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
       */
      preload: {
        input: resolvePath("electron/preload.ts"),

        vite: {
          build: {
            outDir: resolvePath("dist-electron"),

            rollupOptions: {
              output: {
                format: "es",
                entryFileNames: "preload.js",
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
