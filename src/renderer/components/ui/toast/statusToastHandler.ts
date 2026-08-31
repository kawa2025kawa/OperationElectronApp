// src/renderer/components/ui/toast/statusToastHandler.ts

import { useAppStore } from "@renderer/store/index";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";
import type { JobStatus, OperationItem } from "@shared/types/operationType";

const prevStatusMap = new Map<string, JobStatus>();

const TOAST_TYPE_MAP: Partial<Record<JobStatus, ToastType>> = {
  error: "error",
  success: "success",
  ready: "info",
};

export const handleStatusToastNotification = (
  update: OperationItem,
  options?: { isManual?: boolean },
): void => {
  // 手動操作時、またはポーリングOFF時はトーストを出さない
  const state = useAppStore.getState();
  if (options?.isManual || !state.isPolling) return;

  const kanriNo = update?.kanriNo ? String(update.kanriNo) : null;
  const currentStatus = update?.status;
  if (!kanriNo || !currentStatus) return;

  // 1. ステータスに変化がなければ即リターン＆更新
  if (currentStatus === prevStatusMap.get(kanriNo)) return;
  prevStatusMap.set(kanriNo, currentStatus);

  // 2. トースト対象外のステータスなら即リターン
  const toastType = TOAST_TYPE_MAP[currentStatus];
  if (!toastType) return;

  // 3. 手動成功通知の抑止チェック
  if (currentStatus === "success" && consumeSuppressedSuccessToast(kanriNo)) {
    return;
  }

  const item =
    state.operationEntities[kanriNo] ?? state.irregularEntities[kanriNo];

  // 4. 自動開始対象外または手動実行時は非表示
  if (!item?.autoStart || item?.manual) return;

  // 表示名のフォールバック処理（workNameがない場合に空表示になる問題を防止）
  const nameLabel =
    item?.workName ||
    update.workName ||
    ("jobId" in update && update.jobId ? String(update.jobId) : null) ||
    `管理No.${kanriNo}`;

  usePollingToastStore
    .getState()
    .addToast(`${nameLabel} ${currentStatus}`, toastType);
};
