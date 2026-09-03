// src/renderer/components/ui/toast/statusToastHandler.ts

import { useAppStore } from "@renderer/store/index";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";
import type { JobStatus, OperationItem } from "@shared/types/operation";

const TOAST_TYPE_MAP: Partial<Record<JobStatus, ToastType>> = {
  error: "error",
  success: "success",
  ready: "info",
};

export const handleStatusToastNotification = (
  update: OperationItem,
  options?: { isManual?: boolean },
): void => {
  const state = useAppStore.getState();
  if (options?.isManual || !state.isPolling) return;

  const kanriNo = update?.kanriNo ? String(update.kanriNo) : null;
  const currentStatus = update?.status;
  if (!kanriNo || !currentStatus) return;

  const toastStore = usePollingToastStore.getState();

  // 1. ステータス変化がなければ即リターン＆Store側で状態記憶
  if (currentStatus === toastStore.getPrevStatus(kanriNo)) return;
  toastStore.setPrevStatus(kanriNo, currentStatus);

  // 2. トースト対象外のステータスならリターン
  const toastType = TOAST_TYPE_MAP[currentStatus];
  if (!toastType) return;

  // 3. 手動成功通知の抑止チェック
  if (currentStatus === "success" && consumeSuppressedSuccessToast(kanriNo)) {
    return;
  }

  // 4. Selector/Helper経由での安全な参照（後述の改善2とも連動）
  const item = state.getEntityByKanriNo
    ? state.getEntityByKanriNo(kanriNo)
    : (state.operationEntities[kanriNo] ?? state.irregularEntities[kanriNo]);

  if (!item?.autoStart || item?.manual) return;

  const nameLabel =
    item?.workName ||
    update.workName ||
    (update.kind === "operation" && update.jobId
      ? String(update.jobId)
      : null) ||
    `管理No.${kanriNo}`;

  toastStore.addToast(`${nameLabel} ${currentStatus}`, toastType);
};
