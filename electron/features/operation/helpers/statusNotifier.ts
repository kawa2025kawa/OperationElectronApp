// electron/features/operation/helpers/statusNotifier.ts
import { BrowserWindow } from "electron";
import type { OperationStatusFields } from "@shared/types/operationType";

export function broadcastStatusUpdate(
  kanriNo: string,
  status: OperationStatusFields,
): void {
  const window = BrowserWindow.getAllWindows()[0];
  if (!window || window.isDestroyed()) return;

  window.webContents.send("operationStatusUpdated", {
    status: {
      kanriNo,
      ...status,
    },
  });
}
