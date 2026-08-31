// electron/features/operation/monitors/trackerMonitor.ts

import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";
import {
  applyTrackerItem,
  fetchTrackerByJobId,
} from "@electron/features/operation/services/trackerServiceClient";
import type { OperationItem } from "@shared/types/operationType";
import { JOB_STATUS } from "@shared/types/operationType";

/**
 * Target オブジェクトが有効な JobID を保持しているか判定
 */
export function hasJobId(target: OperationItem): boolean {
  return (
    "jobId" in target &&
    typeof target.jobId === "string" &&
    target.jobId.trim() !== "" &&
    target.jobId !== "-"
  );
}

/**
 * Tracker API 監視対象のターゲットか判定
 */
export function isTrackerTarget(target: OperationItem): boolean {
  if (!hasJobId(target)) return false;

  const currentStatus = getStatus(target.kanriNo)?.status;
  return (
    currentStatus === JOB_STATUS.READY ||
    currentStatus === JOB_STATUS.RUNNING ||
    currentStatus === JOB_STATUS.SCRIPT_RUNNING
  );
}

/**
 * 外部（Polling等）向け：監視対象となるターゲットのデバッグ情報を抽出
 */
export function getActiveTrackerTargets(targets: OperationItem[]): Array<{
  kanriNo: string | number;
  workName?: string;
}> {
  return targets
    .filter(isTrackerTarget)
    .map((t) => ({ kanriNo: t.kanriNo, workName: t.workName }));
}

/**
 * 単一ターゲットの Tracker API 状態を取得して同期更新
 */
async function updateTracker(target: OperationItem): Promise<void> {
  try {
    const [tracker] = await fetchTrackerByJobId(target);
    if (!tracker) return;

    const item = applyTrackerItem(tracker, target);
    updateStatus({
      kanriNo: target.kanriNo,
      status: item.status,
      comment: item.comment,
      startTime: item.startTime,
      endTime: item.endTime,
      expectedStartTime: item.expectedStartTime,
      expectedEndTime: item.expectedEndTime,
      substatus: item.substatus,
      info: item.info,
    });
  } catch (error) {
    console.error("[TrackerMonitor] Tracker FAILED", {
      kanriNo: target.kanriNo,
      jobId: "jobId" in target ? target.jobId : undefined,
      error,
    });
  }
}

/**
 * 監視対象となる全ターゲットの Tracker API ステータスを並列同期
 */
export async function syncTrackerStatuses(
  targets: OperationItem[],
): Promise<void> {
  const trackerTargets = targets.filter(isTrackerTarget);
  console.log("[TrackerMonitor] tracker targets", {
    count: trackerTargets.length,
  });
  await Promise.all(trackerTargets.map(updateTracker));
}
