// electron/main.ts

import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { setupIpcHandlers } from "./ipc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * BrowserWindow生成
 */
function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,

    webPreferences: {
      preload: preloadPath,

      contextIsolation: true,
      nodeIntegration: false,

      /**
       * keytar / filesystem 等を
       * main process側で扱うため無効化しない
       */
      sandbox: false,
    },
  });

  /**
   * IPC登録
   *
   * renderer起動前に必ず登録する
   */
  setupIpcHandlers();

  /**
   * Renderer読み込み
   */
  void loadRenderer();

  /**
   * 外部URL制御
   */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);

    return {
      action: "deny",
    };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Rendererロード
 */
async function loadRenderer(): Promise<void> {
  if (!mainWindow) {
    return;
  }

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    await mainWindow.loadURL(devUrl);

    /**
     * 開発時のみDevTools表示
     */
    mainWindow.webContents.openDevTools({
      mode: "detach",
    });

    return;
  }

  await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

/**
 * Electron起動
 */
app
  .whenReady()
  .then(() => {
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

/**
 * Windows / Linux終了
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
