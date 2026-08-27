// src/renderer/components/ui/toast/statusToastHandler.ts

import { useAppStore } from "@shared/store/index";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";
import type {
  JobStatus,
  OperationItem,
  OperationJobItem,
} from "@shared/types/operationType";

const TARGET_STATUSES: Set<JobStatus> = new Set(["success", "ready", "error"]);
const prevStatusMap = new Map<string, JobStatus>();

const TOAST_TYPE_MAP: Record<JobStatus, ToastType> = {
  error: "error",
  success: "success",
  ready: "info",
  running: "info",
  scriptRunning: "info",
  waiting: "info",
  scheduled: "info",
};

/** OperationJobItem（jobIdを持つ型）かどうかを判定する Type Guard */
const isOperationJobItem = (item?: OperationItem): item is OperationJobItem =>
  Boolean(item && "jobId" in item);

/** トースト表示用の識別名（JobID または workName）を取得 */
const getToastNameLabel = (item?: OperationItem): string => {
  if (isOperationJobItem(item)) {
    const jobId = item.jobId?.trim();
    if (jobId && jobId !== "-") {
      return jobId;
    }
  }
  return item?.workName ?? "";
};

export const handleStatusToastNotification = (
  update: OperationItem,
  options?: { isManual?: boolean }, // 🎯 手動呼び出しを識別するオプション追加
): void => {
  // 🎯 1. 明示的な手動操作フラグがある場合は即リターン（トーストを出さない）
  if (options?.isManual) return;

  const kanriNo = update?.kanriNo ? String(update.kanriNo) : null;
  const currentStatus = update?.status;

  if (!kanriNo || !currentStatus) return;

  const previousStatus = prevStatusMap.get(kanriNo);
  if (currentStatus === previousStatus) return;

  // ステータス記憶の更新
  prevStatusMap.set(kanriNo, currentStatus);

  if (!TARGET_STATUSES.has(currentStatus)) return;

  // 🎯 2. 手動更新時に発行された成功通知抑止フラグのチェック
  if (currentStatus === "success" && consumeSuppressedSuccessToast(kanriNo)) {
    return;
  }

  const state = useAppStore.getState();
  const item =
    state.operationEntities[kanriNo] ?? state.irregularEntities[kanriNo];

  // 🎯 3. 自動開始対象（autoStart: true）かつ、手動フラグ（manual）が true でない場合のみトーストを出す
  if (!item?.autoStart || item?.manual === true) return;

  const nameLabel = getToastNameLabel(item);

  usePollingToastStore.getState().addToast(`${nameLabel} ${currentStatus}`, {
    type: TOAST_TYPE_MAP[currentStatus] ?? "info",
    isAutoMonitored: true,
  });
};
