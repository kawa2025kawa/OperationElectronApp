// electron/trpc/routers/systemRouter.ts

import {
  app,
  BrowserWindow,
  dialog,
  shell,
  type OpenDialogOptions,
} from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { publicProcedure, router } from "@electron/trpc/trpc";
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

function isExternalUrl(value: string): boolean {
  return /^(https?|mailto|tel):/i.test(value);
}

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

  openExternal: publicProcedure
    .input(z.object({ urlOrPath: z.string() }))
    .mutation(async ({ input }) => {
      const target = input.urlOrPath.trim();
      if (!target) return null;

      if (isExternalUrl(target)) {
        await shell.openExternal(target);
        return null;
      }

      const normalized = target.replace(/\//g, "\\");
      const error = await shell.openPath(normalized);
      if (error) {
        throw new Error(`Failed to open path: ${error}`);
      }
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
  }),
});
