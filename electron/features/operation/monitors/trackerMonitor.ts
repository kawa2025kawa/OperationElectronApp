// electron/features/operation/monitors/trackerMonitor.ts

import { updateStatus } from "@electron/features/operation/statusManager";
import {
  applyTrackerItem,
  fetchTrackerByJobId,
} from "@electron/features/operation/services/trackerServiceClient";
import type { OperationItem } from "@shared/types/operation";
import { JOB_STATUS } from "@shared/types/operation";

/**
 * ターゲットが有効な JobID を保持しているか判定
 */
export function hasJobId(target: OperationItem): boolean {
  if (target.kind !== "operation") return false;
  const idStr = String(target.jobId ?? "").trim();
  return idStr !== "" && idStr !== "-";
}

/**
 * Tracker API 監視対象の判定
 * 一元管理された status の値を直接判定
 */
export function isTrackerTarget(target: OperationItem): boolean {
  if (!hasJobId(target)) return false;

  const currentStatus = target.status;
  return (
    currentStatus === JOB_STATUS.READY ||
    currentStatus === JOB_STATUS.RUNNING ||
    currentStatus === JOB_STATUS.SCRIPT_RUNNING
  );
}

export function getActiveTrackerTargets(targets: OperationItem[]): Array<{
  kanriNo: string | number;
  workName?: string;
}> {
  return targets
    .filter(isTrackerTarget)
    .map((t) => ({ kanriNo: t.kanriNo, workName: t.workName }));
}

async function updateTracker(target: OperationItem): Promise<void> {
  try {
    const [tracker] = await fetchTrackerByJobId(target);
    if (!tracker) return;

    const item = applyTrackerItem(tracker, target);
    const targetJobId = target.kind === "operation" ? target.jobId : undefined;

    console.log(
      `[TrackerMonitor] Updating Status for No.${target.kanriNo} (${targetJobId ?? "N/A"}):`,
      {
        fromStatus: target.status,
        toStatus: item.status,
      },
    );

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
      jobId: target.kind === "operation" ? target.jobId : undefined,
      error,
    });
  }
}

/**
 * 一元管理データ（targets）を受け取り、監視対象のみを並列同期
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
