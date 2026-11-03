// electron/ipc/ipcHelper.ts

import { ipcMain, type IpcMainInvokeEvent } from "electron";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

/**
 * 型安全な IPC ハンドラー登録ラッパー
 * チャンネル名に応じた引数・戻り値型が自動推論され、冗長なアノテーションが不要になります。
 */
export function registerIpcHandler<K extends keyof IpcChannelMap>(
  channel: K,
  handler: (
    ...args: IpcChannelMap[K]["args"]
  ) => IpcChannelMap[K]["return"] | Promise<IpcChannelMap[K]["return"]>,
): void {
  ipcMain.handle(channel, (_event: IpcMainInvokeEvent, ...args: unknown[]) => {
    return (handler as (...args: unknown[]) => unknown)(...args);
  });
}
