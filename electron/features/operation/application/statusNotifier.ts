// electron/features/operation/application/statusNotifier.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type {
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

type StatusClearPayload = {
  kanriNo: string;
  status: undefined;
  comment: string;
};

type StatusNotification = OperationStatusState | StatusClearPayload;

const readyStatusListeners = new Set<ReadyStatusListener>();

// レンダラープロセスの全ウィンドウへステータス通知メッセージをブロードキャストする。
function notifyRenderer(payload: StatusNotification): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed() || window.webContents?.isDestroyed()) {
      continue;
    }

    try {
      window.webContents.send(IPC_CHANNELS.OPERATION.STATUS_UPDATED, payload);
    } catch (error) {
      console.error("[StatusNotifier] 送信エラー:", error);
    }
  }
}

// ステータス更新内容をレンダラーへ通知する。
export function notifyStatusUpdated(status: OperationStatusState): void {
  notifyRenderer(status);
}

// 指定管理Noのステータスクリア通知をレンダラーへ送信する。
export function notifyStatusCleared(kanriNo: string): void {
  notifyRenderer({
    kanriNo,
    status: undefined,
    comment: "",
  });
}

// ジョブがREADY状態になったことを登録済みリスナーへ通知する。
export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

// READYステータス発生時のコールバックリスナーを登録し、解除関数を返す。
export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}
