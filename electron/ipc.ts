// electron/ipc.ts

import { registerAuthIpc } from "@electron/features/auth/authIpc";
import { registerOperationIpc } from "@electron/features/operation/operationIpc";
import { registerRdpIpc } from "@electron/features/rdp/rdpIpc";
import { registerSystemIpc } from "@electron/features/system/systemIpc";
import { registerTempomaticIpc } from "@electron/features/tempomatic/tempomaticIpc";
// 1. Gmail用のIPC登録関数をインポート（※実際のファイルパスに合わせて調整してください）
import { registerGmailIpc } from "@electron/features/gmail/gmailIpc";

type IpcHandlerSetup = () => void;

const ipcHandlers: IpcHandlerSetup[] = [
  registerAuthIpc,
  registerOperationIpc,
  registerRdpIpc,
  registerSystemIpc,
  registerTempomaticIpc,
  registerGmailIpc, // 2. 配列に追加
];

let initialized = false;

/**
 * IPCハンドラー登録
 *
 * main.ts 起動時に1回だけ実行
 */
export function setupIpcHandlers(): void {
  if (initialized) {
    console.warn("[IPC] handlers already initialized");
    return;
  }

  initialized = true;

  for (const setupHandler of ipcHandlers) {
    try {
      setupHandler();
    } catch (error) {
      console.error("[IPC] handler registration failed", {
        handler: setupHandler.name,
        error,
      });

      throw error;
    }
  }

  console.log("[IPC] handlers initialized", {
    count: ipcHandlers.length,
  });
}
