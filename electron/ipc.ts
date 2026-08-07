// electron/ipc.ts

import { setupAuthHandlers } from "./handlers/authHandlers";
import { setupJobHandlers } from "./handlers/jobHandlers";
import { setupOperationHandlers } from "./handlers/operationHandlers";
import { setupRdpHandlers } from "./handlers/rdpHandlers";
import { setupSystemHandlers } from "./handlers/systemHandlers";
import { setupTempomaticHandlers } from "./handlers/tempomaticHandlers";
import { setupStatusHandlers } from "./handlers/statusHandlers";

type IpcHandlerSetup = () => void;

const ipcHandlers: IpcHandlerSetup[] = [
  setupAuthHandlers,
  setupJobHandlers,
  setupOperationHandlers,
  setupStatusHandlers,
  setupRdpHandlers,
  setupSystemHandlers,
  setupTempomaticHandlers,
];

let initialized = false;

/**
 * IPC handler登録
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
