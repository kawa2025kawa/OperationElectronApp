import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

import packageJson from "./package.json" with { type: "json" };

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const resolvePath = (...paths: string[]): string =>
  path.resolve(rootDir, ...paths);

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
  base: "./",
  clearScreen: false,

  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(packageJson.version),
  },

  plugins: [
    react(),
    vanillaExtractPlugin(),

    electron({
      // ============================================================
      // Electron Main Process
      // electron/main.ts 保存 → Electronを再起動
      // ============================================================
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

      // ============================================================
      // Electron Preload
      // electron/preload.ts 保存 → Windowをreload
      // Electron Main Process自体は再起動しない
      // ============================================================
      preload: {
        input: resolvePath("electron/preload.ts"),

        onstart({ reload }) {
          reload();
        },

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

  // ================================================================
  // Renderer
  // src/**/*.tsx / ts / css 保存 → Vite HMR
  // ================================================================
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

    // dist-electronはRenderer側のwatch対象から除外
    watch: {
      ignored: ["**/dist-electron/**", "**/node_modules/**"],
    },
  },

  // ================================================================
  // Renderer production build
  // ================================================================
  build: {
    target: "esnext",
    outDir: resolvePath("dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }

            if (id.includes("framer-motion") || id.includes("@radix-ui")) {
              return "vendor-ui";
            }

            if (id.includes("@tanstack/react-virtual")) {
              return "vendor-table";
            }
          }
        },
      },
    },
  },
});
