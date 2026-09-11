import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
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
      main: {
        entry: resolvePath("electron/main.ts"),
        vite: {
          build: {
            outDir: resolvePath("dist-electron"),
            target: "node22",
            watch: {
              // 🎯 renderer / shared の変更で Main プロセスが再起動するのを防ぐ
              exclude: ["src/renderer/**", "src/shared/**"],
            },
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
      preload: {
        input: resolvePath("electron/preload.ts"),
        vite: {
          build: {
            outDir: resolvePath("dist-electron"),
            target: "node22",
            watch: {
              // 🎯 renderer 側の変更を除外
              exclude: ["src/renderer/**"],
            },
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

    // 🎯 ビルド時にどのライブラリが大きいかをグラフ可視化するプラグイン
    visualizer({
      open: true, // ビルド完了後に自動的にブラウザで分析画面を開く
      filename: "stats.html",
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
    // 🎯 デスクトップアプリ用にしきい値を 1000 kB (1MB) に引き上げて不要な警告を抑制
    chunkSizeWarningLimit: 1000,
  },
});
