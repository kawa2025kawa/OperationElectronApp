import { app, ipcMain, shell, dialog, BrowserWindow, type OpenDialogOptions } from "electron";

export function setupSystemHandlers(): void {
  ipcMain.handle("getAppVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle("showMainWindow", () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
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

  ipcMain.handle("openExternal", async (_e, { urlOrPath }: { urlOrPath: string }) => {
    await shell.openExternal(urlOrPath);
    return null;
  });

  ipcMain.handle("showOpenDialog", async (_e, options: OpenDialogOptions) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result.canceled ? null : result.filePaths;
  });
}
