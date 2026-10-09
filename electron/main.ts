// electron/main.ts

import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createIPCHandler } from "electron-trpc/main";
import { registerIpcHandlers } from "./ipc/ipcHandlerRegistry";
import { appRouter } from "./trpc/router";
import { stopPolling } from "@electron/features/operation/application/operationScheduler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

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

  // electron-trpc IPC ハンドラーのバインド
  createIPCHandler({
    router: appRouter,
    windows: [mainWindow],
  });

  void loadRenderer().catch((error) => {
    console.error("[Electron] renderer load failed", error);
  });

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
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  const rendererPath = path.join(__dirname, "../dist/index.html");
  await mainWindow.loadFile(rendererPath);
}

app
  .whenReady()
  .then(() => {
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

app.on("before-quit", () => {
  stopPolling();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
