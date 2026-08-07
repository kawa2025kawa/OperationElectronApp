import type { OperationItem, JobStatus } from "@shared/types/operationType";

import {
  getAllStatuses,
  getStatus,
  updateStatus,
} from "@electron/services/statusManager";

import { fetchTrackerByJobId, applyTrackerItem } from "./tracker";

import { executeJob } from "./jobRunner";

let pollingTimer: NodeJS.Timeout | null = null;

let polling = false;

const POLLING_INTERVAL = 60_000;

/**
 * ポーリング開始
 *
 * Tauri:
 * polling::start()
 */
export function startPolling(): void {
  if (polling) {
    console.warn("[Polling] already running");

    return;
  }

  polling = true;

  console.log("[Polling] started");

  void runPollingLoop();
}

/**
 * ポーリング停止
 *
 * Tauri:
 * polling::stop()
 */
export function stopPolling(): void {
  polling = false;

  if (pollingTimer) {
    clearTimeout(pollingTimer);

    pollingTimer = null;
  }

  console.log("[Polling] stopped");
}

/**
 * メインループ
 */
async function runPollingLoop(): Promise<void> {
  while (polling) {
    try {
      const targets = getAllStatuses();

      await updateTrackerStatuses(targets);

      await executeAutoStartJobs(targets);
    } catch (error) {
      console.error("[Polling Error]", error);
    }

    await sleep(POLLING_INTERVAL);
  }
}

/**
 * API監視ターゲット更新
 *
 * Tauri:
 * tracker::fetch_and_apply_status()
 */
async function updateTrackerStatuses(targets: OperationItem[]): Promise<void> {
  const activeTargets = targets.filter((target) => {
    const status = getStatus(target.kanriNo)?.status;

    return !!target.jobId && target.jobId !== "-" && !isCompleted(status);
  });

  await Promise.all(
    activeTargets.map(async (target) => {
      try {
        const trackers = await fetchTrackerByJobId(target);

        const tracker = trackers[0];

        if (!tracker) {
          console.debug("[Polling] Tracker data empty", {
            kanriNo: target.kanriNo,

            jobId: target.jobId,
          });

          return;
        }

        updateStatus(applyTrackerItem(tracker, target));
      } catch (error) {
        console.error("[Polling] Tracker update failed", {
          kanriNo: target.kanriNo,

          jobId: target.jobId,

          error,
        });
      }
    }),
  );
}

/**
 * 自動実行ジョブ
 *
 * Tauri:
 * engine::execute_script()
 */
async function executeAutoStartJobs(targets: OperationItem[]): Promise<void> {
  const jobs = targets.filter((target) => {
    const current = getStatus(target.kanriNo);

    return (
      target.autoStart === true && !!current && !isCompleted(current.status)
    );
  });

  for (const job of jobs) {
    await executeJob(job.kanriNo);
  }
}

/**
 * 完了判定
 *
 * Tauri:
 * JobStatus::is_completed()
 */
function isCompleted(status?: JobStatus | null): boolean {
  return status === "success" || status === "error";
}

/**
 * 待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    pollingTimer = setTimeout(resolve, ms);
  });
}
