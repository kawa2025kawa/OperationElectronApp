// electron/ipc/systemIpc.ts

import { app, dialog, ipcMain, shell, type OpenDialogOptions } from "electron";
import {
  getMainWindow,
  getManualUrl,
  openExternalOrPath,
  readUpdateInfo,
} from "@electron/features/system/systemService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { UpdateInfo } from "@shared/types/system";

export function registerSystemIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_APP_VERSION, (): string => {
    return app.getVersion();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW, (): null => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM.QUIT_APP, (): null => {
    app.quit();
    return null;
  });

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.OPEN_MANUAL,
    async (_event, { target }: { target: string }): Promise<null> => {
      const url = getManualUrl(target);
      await shell.openExternal(url);
      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL,
    async (_event, { urlOrPath }: { urlOrPath: string }): Promise<null> => {
      await openExternalOrPath(urlOrPath);
      return null;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG,
    async (
      _event,
      options?: Record<string, unknown>,
    ): Promise<string[] | null> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;
      const opts = (options ?? {}) as OpenDialogOptions;
      const result = await dialog.showOpenDialog(mainWindow, opts);
      return result.canceled ? null : result.filePaths;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO,
    async (): Promise<UpdateInfo | null> => {
      return readUpdateInfo();
    },
  );
}
