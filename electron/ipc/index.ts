// electron/ipc/index.ts

import { registerAuthIpc } from "./authIpc";
import { registerGmailIpc } from "./gmailIpc";
import { registerOperationIpc } from "./operationIpc";
import { registerOtherIpc } from "./otherViewIpc";
import { registerRdpIpc } from "./rdpIpc";
import { registerSpreadsheetIpc } from "./spreadsheetIpc";
import { registerSystemIpc } from "./systemIpc";
import { registerTempomaticIpc } from "./tempomaticIpc";

export function registerIpcHandlers(): void {
  registerAuthIpc();
  registerSystemIpc();
  registerRdpIpc();
  registerGmailIpc();
  registerSpreadsheetIpc();
  registerTempomaticIpc();
  registerOtherIpc();
  registerOperationIpc();
}
