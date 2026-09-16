// electron/features/operation/polling/trackerMonitor.ts

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
  if (!("jobId" in target) || !target.jobId) return false;
  const idStr = String(target.jobId).trim();
  return idStr !== "" && idStr !== "-";
}

/**
 * Tracker API 監視対象の判定
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

/**
 * 🎯【統一エントリーポイント: 単一実行】
 * 外部APIから最新ステータスを取得し、Memory/Storageを更新した上でマージされた OperationItem を返す
 */
export async function syncTrackerStatus(
  target: OperationItem,
): Promise<OperationItem> {
  if (!hasJobId(target)) return target;

  const kanriNo = String(target.kanriNo).trim();
  const jobId = "jobId" in target ? String(target.jobId).trim() : "N/A";

  console.log(
    `[TrackerMonitor:REQ] 🔍 Requesting Tracker API -> No.${kanriNo} (jobId: ${jobId}, currentStatus: ${target.status ?? "N/A"})`,
  );

  try {
    const [tracker] = await fetchTrackerByJobId(target);

    if (!tracker) {
      console.warn(
        `[TrackerMonitor:RES] ⚠️ No tracker data returned -> No.${kanriNo} (jobId: ${jobId})`,
      );
      return target;
    }

    const updatedEntity = applyTrackerItem(tracker, target);

    console.log(
      `[TrackerMonitor:RES] ✅ Response Received -> No.${kanriNo} (jobId: ${jobId})`,
      {
        fetchedStatus: tracker.status,
        normalizedStatus: updatedEntity.status,
        startTime: updatedEntity.startTime ?? "N/A",
        endTime: updatedEntity.endTime ?? "N/A",
        comment: updatedEntity.comment ?? "",
      },
    );

    updateStatus({
      kanriNo: target.kanriNo,
      status: updatedEntity.status,
      comment: updatedEntity.comment,
      startTime: updatedEntity.startTime,
      endTime: updatedEntity.endTime,
      expectedStartTime: updatedEntity.expectedStartTime,
      expectedEndTime: updatedEntity.expectedEndTime,
      substatus: updatedEntity.substatus,
      info: updatedEntity.info,
    });

    return updatedEntity;
  } catch (error) {
    console.error(
      `[TrackerMonitor:ERR] ❌ Tracker API Request FAILED -> No.${kanriNo} (jobId: ${jobId})`,
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return target;
  }
}

/**
 * 🎯【統一エントリーポイント: 複数括り実行】
 * 一元管理データ（targets）を受け取り、監視対象のみを並列同期
 */
export async function syncTrackerStatuses(
  targets: OperationItem[],
): Promise<OperationItem[]> {
  const trackerTargets = targets.filter(isTrackerTarget);

  if (trackerTargets.length === 0) {
    return [];
  }

  console.log(
    `[TrackerMonitor:BATCH] 🚀 Starting Batch Tracker Sync for ${trackerTargets.length} items...`,
    trackerTargets.map((t) => `No.${t.kanriNo}`),
  );

  const results = await Promise.all(
    trackerTargets.map((t) => syncTrackerStatus(t)),
  );

  console.log(
    `[TrackerMonitor:BATCH] 🎉 Batch Tracker Sync Completed (${results.length} items updated).`,
  );

  return results;
}
