// electron\ipc\ipc.ts

import { registerAuthIpc } from "@electron/features/auth/authIpc";
import { registerGmailIpc } from "@electron/features/gmail/gmailIpc";
import { registerOperationIpc } from "@electron/features/operation/ipc/operationIpc";
import { registerRdpIpc } from "@electron/features/rdp/rdpIpc";
import { registerSpreadsheetIpc } from "@electron/features/spreadsheet/ipc/spreadsheetIpc";
import { registerSystemIpc } from "@electron/features/system/systemIpc";
import { registerTempomaticIpc } from "@electron/features/tempomatic/tempomaticIpc";
import { registerGiftMdIpc } from "@electron/features/other/ipc/giftMdIpc";

type IpcHandlerSetup = () => void;

const IPC_HANDLERS: readonly IpcHandlerSetup[] = [
  registerAuthIpc,
  registerGmailIpc,
  registerOperationIpc,
  registerRdpIpc,
  registerSpreadsheetIpc,
  registerSystemIpc,
  registerTempomaticIpc,
  registerGiftMdIpc,
];

let initialized = false;

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
