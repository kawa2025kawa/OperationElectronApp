// electron/trpc/routers/systemRouter.ts

import { app, dialog, shell, type OpenDialogOptions } from "electron";
import { z } from "zod";
import {
  getMainWindow,
  getManualUrl,
  openExternalOrPath,
  readUpdateInfo,
} from "@electron/features/system/systemService";
import { publicProcedure, router } from "@electron/trpc/trpc";

export const systemRouter = router({
  getAppVersion: publicProcedure.query(() => {
    return app.getVersion();
  }),

  showMainWindow: publicProcedure.mutation(() => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return null;
  }),

  quitApp: publicProcedure.mutation(() => {
    app.quit();
    return null;
  }),

  openManual: publicProcedure
    .input(z.object({ target: z.string() }))
    .mutation(async ({ input }) => {
      const url = getManualUrl(input.target);
      await shell.openExternal(url);
      return null;
    }),

  openExternal: publicProcedure
    .input(z.object({ urlOrPath: z.string() }))
    .mutation(async ({ input }) => {
      await openExternalOrPath(input.urlOrPath);
      return null;
    }),

  showOpenDialog: publicProcedure
    .input(z.any().optional())
    .mutation(async ({ input }) => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;
      const options = (input ?? {}) as OpenDialogOptions;
      const result = await dialog.showOpenDialog(mainWindow, options);
      return result.canceled ? null : result.filePaths;
    }),

  readUpdateInfo: publicProcedure.query(async () => {
    return readUpdateInfo();
  }),
});
