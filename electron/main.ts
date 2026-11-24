// electron/main.ts

import { app, BrowserWindow, Menu, session, shell } from "electron";
import windowStateKeeper from "electron-window-state";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stopPolling } from "@electron/features/operation/application/operationScheduler";
import { initializeActiveFlags } from "@electron/features/operation/application/statusManager";
import { registerIpcHandlers } from "./ipc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function isAllowedAppNavigation(targetUrl: string): boolean {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    try {
      return new URL(targetUrl).origin === new URL(devUrl).origin;
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "file:") {
      return false;
    }
    const distRootUrl = pathToFileURL(
      path.resolve(__dirname, "../dist"),
    ).href;
    return parsed.href.startsWith(distRootUrl);
  } catch {
    return false;
  }
}

function configureContentSecurityPolicy(): void {
  const isDev = !app.isPackaged && Boolean(process.env.VITE_DEV_SERVER_URL);

  const cspDirectives = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    isDev
      ? "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*"
      : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [cspDirectives],
      },
    });
  });
}

function enforceProductionDevToolsLock(win: BrowserWindow): void {
  if (!app.isPackaged) return;

  win.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toUpperCase();
    const isF12 = key === "F12";
    const isInspectShortcut =
      (input.control || input.meta) &&
      input.shift &&
      (key === "I" || key === "J" || key === "C");

    if (isF12 || isInspectShortcut) {
      event.preventDefault();
    }
  });

  win.webContents.on("devtools-opened", () => {
    win.webContents.closeDevTools();
  });
}

// メインアプリケーションウィンドウを生成・設定し、ライフサイクルイベントを登録する。
function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.cjs");

  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1400,
    defaultHeight: 800,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: !app.isPackaged,
    },
  });

  enforceProductionDevToolsLock(mainWindow);
  mainWindowState.manage(mainWindow);

  void loadRenderer().catch((error) => {
    console.error("[Electron] renderer load failed", error);
  });

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (!isAllowedAppNavigation(navigationUrl)) {
      console.warn(
        `[Electron Security] Blocked navigation to: ${navigationUrl}`,
      );
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      void shell.openExternal(url);
    }
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

// Electronの起動完了後にセンターフラグを復元し、CSP・IPC・メインウィンドウを初期化する。
app
  .whenReady()
  .then(async () => {
    configureContentSecurityPolicy();
    await initializeActiveFlags();

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