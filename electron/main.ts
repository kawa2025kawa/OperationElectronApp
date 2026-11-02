// electron/main.ts

import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stopPolling } from "@electron/features/operation/application/operationScheduler";
import { initializeActiveFlags } from "@electron/features/operation/application/statusManager";
import { registerIpcHandlers } from "./ipc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// メインアプリケーションウィンドウを生成・設定し、ライフサイクルイベントを登録する。
function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.cjs");
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  void loadRenderer().catch((error) => {
    console.error("[Electron] renderer load failed", error);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 開発環境または本番環境に応じてレンダラー画面を読み込む。
async function loadRenderer(): Promise<void> {
  if (!mainWindow) return;

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  const rendererPath = path.join(__dirname, "../dist/index.html");
  await mainWindow.loadFile(rendererPath);
}

// Electronの起動完了後にセンターフラグを復元し、IPCとメインウィンドウを初期化する。
app
  .whenReady()
  .then(() => {
    initializeActiveFlags();
    registerIpcHandlers();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((error) => {
    console.error("[Electron] startup failed", error);
    app.quit();
  });

// アプリケーション終了前にバックグラウンドのポーリング処理を停止する。
app.on("before-quit", () => {
  stopPolling();
});

// すべてのウィンドウが閉じられた際、macOS以外ではアプリケーションを終了する。
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
