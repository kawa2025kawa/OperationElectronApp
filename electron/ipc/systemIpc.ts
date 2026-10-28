// electron/ipc/systemIpc.ts

import { app, dialog, ipcMain, shell, type OpenDialogOptions } from "electron";
import {
  getMainWindow,
  getManualUrl,
  openExternalOrPath,
  readUpdateInfo,
} from "@electron/features/system/systemService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// アプリ基本操作（バージョン取得・ウィンドウ表示・終了・マニュアル・ファイル選択等）のIPCハンドラーを登録する。
export function registerSystemIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.GET_APP_VERSION,
    (): IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.GET_APP_VERSION]["return"] => {
      return app.getVersion();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW,
    (): IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW]["return"] => {
      const mainWindow = getMainWindow();

      if (!mainWindow) return null;

      if (mainWindow.isMinimized()) mainWindow.restore();

      mainWindow.show();
      mainWindow.focus();

      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.QUIT_APP,
    (): IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.QUIT_APP]["return"] => {
      app.quit();
      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.OPEN_MANUAL,
    async (
      _event,
      {
        target,
      }: IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.OPEN_MANUAL]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.OPEN_MANUAL]["return"]
    > => {
      const url = getManualUrl(target);
      await shell.openExternal(url);
      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL,
    async (
      _event,
      {
        urlOrPath,
      }: IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL]["return"]
    > => {
      await openExternalOrPath(urlOrPath);
      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG,
    async (
      _event,
      options?: IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG]["return"]
    > => {
      const mainWindow = getMainWindow();

      if (!mainWindow) return null;

      const opts = (options ?? {}) as OpenDialogOptions;
      const result = await dialog.showOpenDialog(mainWindow, opts);

      return result.canceled ? null : result.filePaths;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO]["return"]
    > => {
      return readUpdateInfo();
    },
  );
}
