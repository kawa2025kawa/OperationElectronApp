// electron/main.ts

import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupIpcHandlers } from "./ipc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.js");
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

  void loadRenderer();

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

async function loadRenderer(): Promise<void> {
  if (!mainWindow) {
    return;
  }
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({
      mode: "detach",
    });
    return;
  }
  await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

app
  .whenReady()
  .then(() => {
    // ウインドウ作成前に一度だけIPCハンドラーを登録
    setupIpcHandlers();
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
