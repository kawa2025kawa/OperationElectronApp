import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupIpcHandlers } from "./ipc";

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

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[Electron] did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL,
      });
    },
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[Electron] did-finish-load");
  });

  mainWindow.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("[Electron] preload-error", {
      preloadPath,
      error,
    });
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

    mainWindow.webContents.openDevTools({
      mode: "detach",
    });

    return;
  }

  const rendererPath = path.join(__dirname, "../dist/index.html");

  console.log("[Electron] renderer:", rendererPath);
  console.log("[Electron] preload:", path.join(__dirname, "preload.js"));

  await mainWindow.loadFile(rendererPath);
}

app
  .whenReady()
  .then(() => {
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
