// electron/features/operation/application/statusNotifier.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  OperationStatusNotification,
  OperationStatusState,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";

export type StatusTarget =
  | (OperationMaster & {
      targetType: "operation";
    })
  | (TodayIrregularMaster & {
      targetType: "today";
    });

export type ReadyStatusListener = (target: StatusTarget) => void;

const readyStatusListeners = new Set<ReadyStatusListener>();

function notifyRenderer(notification: OperationStatusNotification): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed() || window.webContents.isDestroyed()) {
      continue;
    }

    try {
      window.webContents.send(
        IPC_CHANNELS.OPERATION.STATUS_UPDATED,
        notification,
      );
    } catch (error) {
      console.error("[StatusNotifier] 送信エラー:", error);
    }
  }
}

export function notifyStatusUpdated(status: OperationStatusState): void {
  notifyRenderer({
    type: "updated",
    update: status,
  });
}

export function notifyStatusCleared(kanriNo: string): void {
  notifyRenderer({
    type: "cleared",
    kanriNo,
  });
}

export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}
