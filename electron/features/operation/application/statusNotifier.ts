// electron/features/operation/application/statusNotifier.ts

import { BrowserWindow } from "electron";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type {
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

export type StatusTarget =
  | (OperationMaster & {
      targetType: "operation";
    })
  | (TodayIrregularMaster & {
      targetType: "today";
    });

export type ReadyStatusListener = (target: StatusTarget) => void;

type StatusClearPayload = {
  kanriNo: string;
  status: undefined;
  comment: string;
};

type StatusNotification = OperationStatusState | StatusClearPayload;

const readyStatusListeners = new Set<ReadyStatusListener>();

function notifyRenderer(payload: StatusNotification): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) {
      continue;
    }

    window.webContents.send("operation:status-updated", payload);
  }
}

export function notifyStatusUpdated(status: OperationStatusState): void {
  notifyRenderer(status);
}

export function notifyStatusCleared(kanriNo: string): void {
  notifyRenderer({
    kanriNo,
    status: undefined,
    comment: "",
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
