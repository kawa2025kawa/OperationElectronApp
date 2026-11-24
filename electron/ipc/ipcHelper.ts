// electron/ipc/ipcHelper.ts

import { app, ipcMain, type IpcMainInvokeEvent } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

function isAllowedSenderFrame(event: IpcMainInvokeEvent): boolean {
  const frameUrl = event.senderFrame?.url;
  if (!frameUrl) {
    return false;
  }

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
    if (parsed.protocol !== "file:") {
      return false;
    }

    const expectedIndexPath = path.resolve(
      app.getAppPath(),
      "dist",
      "index.html",
    );
    const actualPath = path.resolve(fileURLToPath(parsed));
    return (
      actualPath.toLowerCase() === expectedIndexPath.toLowerCase() ||
      parsed.href.startsWith(
        pathToFileURL(path.resolve(app.getAppPath(), "dist")).href,
      )
    );
  } catch {
    return false;
  }
}

/**
- 型安全な IPC ハンドラー登録ラッパー
- 送信元フレームを検証したうえでチャンネル処理を実行する。
 */
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