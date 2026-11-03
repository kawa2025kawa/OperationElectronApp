// electron/ipc/systemIpc.ts

import path from "node:path";
import { app, dialog, shell, type OpenDialogOptions } from "electron";
import fs from "fs-extra";

import {
  getMainWindow,
  getManualUrl,
  openExternalOrPath,
  readUpdateInfo,
} from "@electron/features/system/systemService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { registerIpcHandler } from "./ipcHelper";

// アプリ基本操作（バージョン取得・ウィンドウ表示・終了・マニュアル・ファイル選択等）のIPCハンドラーを登録する。
export function registerSystemIpc(): void {
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
      const url = getManualUrl(target, isAuto);
      await shell.openExternal(url);
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

    const opts = (options ?? {}) as OpenDialogOptions;
    const result = await dialog.showOpenDialog(mainWindow, opts);
    return result.canceled ? null : result.filePaths;
  });

  registerIpcHandler(IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO, () =>
    readUpdateInfo(),
  );

  registerIpcHandler(
    IPC_CHANNELS.SYSTEM.RENAME_FILE,
    async ({ filePath, newName }) => {
      if (!filePath || !(await fs.pathExists(filePath))) {
        throw new Error(`対象ファイルが存在しません: ${filePath}`);
      }

      const dir = path.dirname(filePath);
      const targetPath = path.join(dir, newName);

      if (filePath === targetPath) {
        return { success: true, newPath: targetPath };
      }

      if (await fs.pathExists(targetPath)) {
        throw new Error(`同名のファイルが既に存在します: ${newName}`);
      }

      await fs.rename(filePath, targetPath);
      return { success: true, newPath: targetPath };
    },
  );
}
