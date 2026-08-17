// electron/features/operation/jobRunner.ts

import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { dispatchScript } from "@electron/features/operation/jobs/scripts";
import { hasJobId } from "@electron/features/operation/monitors/trackerMonitor";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

const runningJobs = new Set<string>();

/**
 * 指定管理番号のジョブを実行
 */
export async function executeJob(rawKanriNo: string | number): Promise<string> {
  const kanriNo = String(rawKanriNo).trim();
  if (!kanriNo) {
    throw new Error("kanriNo is required");
  }

  if (runningJobs.has(kanriNo)) {
    console.warn(`[JobRunner] already running: ${kanriNo}`);
    return "Already running";
  }

  runningJobs.add(kanriNo);
  const startTime = new Date().toISOString();

  try {
    updateStatus({
      kanriNo,
      status: JOB_STATUS.SCRIPT_RUNNING,
      comment: "実行中...",
      startTime,
    });

    const result = await dispatchScript(kanriNo);

    updateStatus({
      kanriNo,
      status: JOB_STATUS.SUCCESS,
      comment: result,
      startTime,
      endTime: new Date().toISOString(),
    });

    console.log(`[JobRunner] completed: ${kanriNo}`);
    return result;
  } catch (error) {
    updateStatus({
      kanriNo,
      status: JOB_STATUS.ERROR,
      comment: error instanceof Error ? error.message : String(error),
      startTime,
      endTime: new Date().toISOString(),
    });

    console.error(`[JobRunner] failed: ${kanriNo}`, error);
    throw error;
  } finally {
    runningJobs.delete(kanriNo);
  }
}

/**
 * 自動起動対象のジョブを一括実行
 */
export async function triggerAutoStartJobs(
  targets: OperationItem[],
  runningCheck: () => boolean,
): Promise<void> {
  const jobs = targets.filter((target) => {
    if (target.autoStart !== true) return false;
    if (hasJobId(target)) return false;
    const currentStatus = getStatus(target.kanriNo)?.status;
    return currentStatus === JOB_STATUS.READY;
  });

  if (jobs.length === 0) return;

  console.log("[JobRunner] auto-start jobs", { count: jobs.length });

  for (const job of jobs) {
    if (!runningCheck()) return;

    executeJob(job.kanriNo).catch((error) => {
      console.error("[JobRunner] Auto-start FAILED", {
        kanriNo: job.kanriNo,
        error,
      });
    });
  }
}
