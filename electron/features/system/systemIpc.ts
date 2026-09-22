// electron/features/system/systemIpc.ts

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  type OpenDialogOptions,
} from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { UpdateInfo } from "@shared/types/system";

const UPDATE_DIRECTORY =
  "\\\\S0088210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp";

const UPDATE_INFO_PATH = path.join(
  UPDATE_DIRECTORY,
  "OperationElectronApp_update.json",
);

function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0];
  return win && !win.isDestroyed() ? win : null;
}

function isUpdateInfo(value: unknown): value is UpdateInfo {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).version === "string"
  );
}

export function registerSystemIpc(): void {
  ipcMain.handle("getAppVersion", () => app.getVersion());

  ipcMain.handle("showMainWindow", () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    return null;
  });

  ipcMain.handle("quitApp", () => {
    app.quit();
    return null;
  });

  ipcMain.handle(
    "openExternal",
    async (_event, { urlOrPath }: { urlOrPath: string }) => {
      const target = urlOrPath.trim();
      if (!target) return null;

      if (/^https?:\/\//i.test(target)) {
        await shell.openExternal(target);
      } else {
        const normalized = target.replace(/\//g, "\\");
        const error = await shell.openPath(normalized);
        if (error) {
          throw new Error(`Failed to open path: ${error}`);
        }
      }
      return null;
    },
  );

  ipcMain.handle(
    "showOpenDialog",
    async (_event, options: OpenDialogOptions) => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      const result = await dialog.showOpenDialog(mainWindow, options);
      return result.canceled ? null : result.filePaths;
    },
  );

  ipcMain.handle("readUpdateInfo", async (): Promise<UpdateInfo | null> => {
    try {
      const content = await fs.readFile(UPDATE_INFO_PATH, "utf-8");
      const data: unknown = JSON.parse(content);

      if (!isUpdateInfo(data)) {
        console.warn("[Update] Invalid update info format");
        return null;
      }

      return data;
    } catch (error) {
      console.warn("[Update] Update info unavailable:", error);
      return null;
    }
  });
}
