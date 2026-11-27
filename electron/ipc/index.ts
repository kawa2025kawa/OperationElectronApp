// electron/ipc/index.ts

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  app,
  dialog,
  ipcMain,
  shell,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
} from "electron";
import fs from "fs-extra";
import {
  getMainWindow,
  getManualUrl,
  openExternalOrPath,
  readUpdateInfo,
} from "@electron/features/system/systemService";
import {
  IPC_CHANNELS,
  type IpcChannelMap,
} from "@shared/types/electron/ipcTypes";
import { registerOperationIpc } from "./operationIpc";
import { registerServiceIpc } from "./serviceIpc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INVALID_WINDOWS_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/;

function assertSafeFileName(fileName: string): string {
  const trimmed = fileName?.trim() ?? "";
  if (
    !trimmed ||
    trimmed === "." ||
    trimmed === ".." ||
    path.basename(trimmed) !== trimmed ||
    INVALID_WINDOWS_FILENAME_CHARS.test(trimmed)
  ) {
    throw new Error(`不正なファイル名が指定されました: ${fileName}`);
  }
  return trimmed;
}

function isAllowedSenderFrame(event: IpcMainInvokeEvent): boolean {
  const frameUrl = event.senderFrame?.url;
  if (!frameUrl) return false;

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    try {
      return new URL(frameUrl).origin === new URL(devUrl).origin;
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(frameUrl);
    if (parsed.protocol !== "file:") return false;

    const distPath = path.resolve(__dirname, "../dist");
    const expectedIndexPath = path.join(distPath, "index.html");
    const actualPath = path.resolve(fileURLToPath(parsed));
    return (
      actualPath.toLowerCase() === expectedIndexPath.toLowerCase() ||
      parsed.href.startsWith(pathToFileURL(distPath).href)
    );
  } catch {
    return false;
  }
}

export function registerIpcHandler<K extends keyof IpcChannelMap>(
  channel: K,
  handler: (
    ...args: IpcChannelMap[K]["args"]
  ) => IpcChannelMap[K]["return"] | Promise<IpcChannelMap[K]["return"]>,
): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
    if (!isAllowedSenderFrame(event)) {
      console.warn(
        `[IPC Security] Blocked unauthorized IPC call on channel "${String(channel)}" from "${event.senderFrame?.url ?? "unknown"}"`,
      );
      throw new Error("Unauthorized IPC sender");
    }

    return (handler as (...args: unknown[]) => unknown)(...args);
  });
}

function registerSystemIpc(): void {
  registerIpcHandler(IPC_CHANNELS.SYSTEM.GET_APP_VERSION, () =>
    app.getVersion(),
  );

  registerIpcHandler(IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW, () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return null;
  });

  registerIpcHandler(IPC_CHANNELS.SYSTEM.QUIT_APP, () => {
    app.quit();
    return null;
  });

  registerIpcHandler(
    IPC_CHANNELS.SYSTEM.OPEN_MANUAL,
    async ({ target, isAuto }) => {
      await shell.openExternal(getManualUrl(target, isAuto));
      return null;
    },
  );

  registerIpcHandler(
    IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL,
    async ({ urlOrPath }) => {
      await openExternalOrPath(urlOrPath);
      return null;
    },
  );

  registerIpcHandler(IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG, async (options) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(
      mainWindow,
      (options ?? {}) as OpenDialogOptions,
    );
    return result.canceled ? null : result.filePaths;
  });

  registerIpcHandler(IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO, () =>
    readUpdateInfo(),
  );

  registerIpcHandler(
    IPC_CHANNELS.SYSTEM.RENAME_FILE,
    async ({ filePath, newName }) => {
      const safeNewName = assertSafeFileName(newName);

      if (!filePath || !(await fs.pathExists(filePath))) {
        throw new Error(`対象ファイルが存在しません: ${filePath}`);
      }

      const targetPath = path.join(path.dirname(filePath), safeNewName);
      if (filePath === targetPath) {
        return { success: true, newPath: targetPath };
      }

      if (await fs.pathExists(targetPath)) {
        throw new Error(`同名のファイルが既に存在します: ${safeNewName}`);
      }

      await fs.rename(filePath, targetPath);
      return { success: true, newPath: targetPath };
    },
  );
}

export function registerIpcHandlers(): void {
  registerSystemIpc();
  registerServiceIpc();
  registerOperationIpc();
}