// electron/ipc.ts

import { registerAuthIpc } from "@electron/features/auth/authIpc";
import { registerGmailIpc } from "@electron/features/gmail/gmailIpc";
import { registerOperationIpc } from "@electron/features/operation/operationIpc";
import { registerRdpIpc } from "@electron/features/rdp/rdpIpc";
import { registerSystemIpc } from "@electron/features/system/systemIpc";
import { registerTempomaticIpc } from "@electron/features/tempomatic/tempomaticIpc";

type IpcHandlerSetup = () => void;

const IPC_HANDLERS: readonly IpcHandlerSetup[] = [
  registerAuthIpc,
  registerGmailIpc,
  registerOperationIpc,
  registerRdpIpc,
  registerSystemIpc,
  registerTempomaticIpc,
];

let initialized = false;

/**
 * Register all Electron IPC handlers.
 *
 * This function must be called once during the Electron main-process startup.
 */
export function registerIpcHandlers(): void {
  if (initialized) {
    console.warn("[IPC] handlers already initialized");
    return;
  }

  try {
    for (const registerHandler of IPC_HANDLERS) {
      registerHandler();
    }

    initialized = true;

    console.log("[IPC] handlers initialized", {
      count: IPC_HANDLERS.length,
    });
  } catch (error) {
    console.error("[IPC] handler registration failed", error);
    throw error;
  }
}

// 後方互換性用エイリアス
export const setupIpcHandlers = registerIpcHandlers;
