// electron/features/operation/application/statusNotifier.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  OperationStatusNotification,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { ReadyStatusListener, StatusTarget } from "./statusTypes";

export type { ReadyStatusListener };

const readyStatusListeners = new Set<ReadyStatusListener>();

// 全ウィンドウの有効なレンダラーへステータス通知を送信する。
function broadcast(notification: OperationStatusNotification): void {
  const windows = BrowserWindow.getAllWindows();

  for (const window of windows) {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
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
}

// ステータス更新通知をレンダラーへ配信する。
export function notifyStatusUpdated(status: OperationStatusState): void {
  broadcast({
    type: "updated",
    update: status,
  });
}

// ステータスクリア通知をレンダラーへ配信する。
export function notifyStatusCleared(kanriNo: string): void {
  broadcast({
    type: "cleared",
    kanriNo,
  });
}

// READY状態に遷移したターゲットをリスナーへ通知する。
export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

// READY状態遷移リスナーを登録し、解除関数を返す。
export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}
