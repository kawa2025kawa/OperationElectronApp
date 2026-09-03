import {
  JOB_STATUS,
  type JobResult,
  type OperationItem,
} from "@shared/types/operation";
import { dispatchScript } from "@electron/features/operation/jobs/scripts";
import { hasJobId } from "@electron/features/operation/monitors/trackerMonitor";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

const runningJobs = new Set<string>();

function cleanErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);

  return rawMessage
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

function isJobRunning(kanriNo: string): boolean {
  return runningJobs.has(kanriNo);
}

function markJobRunning(kanriNo: string): void {
  runningJobs.add(kanriNo);
}

function markJobFinished(kanriNo: string): void {
  runningJobs.delete(kanriNo);
}

export async function executeJob(
  rawKanriNo: string | number,
  filePath?: string | string[],
): Promise<JobResult> {
  const kanriNo = String(rawKanriNo).trim();

  if (!kanriNo) {
    throw new Error("kanriNo is required");
  }

  if (isJobRunning(kanriNo)) {
    console.warn(`[JobRunner] already running: ${kanriNo}`);
    throw new Error(`管理No.${kanriNo} は既に実行中です`);
  }

  markJobRunning(kanriNo);

  const startTime = new Date().toISOString();

  try {
    updateStatus({
      kanriNo,
      status: JOB_STATUS.SCRIPT_RUNNING,
      comment: "実行中...",
      startTime,
    });

    const result = await dispatchScript(kanriNo, filePath);
    const endTime = new Date().toISOString();

    updateStatus({
      kanriNo,
      status: JOB_STATUS.SUCCESS,
      comment: result.message,
      startTime,
      endTime,
    });

    console.log(`[JobRunner] completed: ${kanriNo}`, {
      message: result.message,
      artifactCount: result.artifacts?.length ?? 0,
    });

    return result;
  } catch (error) {
    const formattedError = cleanErrorMessage(error);
    const endTime = new Date().toISOString();

    updateStatus({
      kanriNo,
      status: JOB_STATUS.ERROR,
      comment: formattedError,
      startTime,
      endTime,
    });

    console.error(`[JobRunner] failed: ${kanriNo}`, formattedError);

    throw new Error(formattedError, {
      cause: error,
    });
  } finally {
    markJobFinished(kanriNo);
  }
}

export async function triggerAutoStartJobs(
  targets: OperationItem[],
  runningCheck: () => boolean,
): Promise<void> {
  const jobs = targets.filter(
    (target) =>
      target.autoStart === true &&
      !hasJobId(target) &&
      getStatus(target.kanriNo)?.status === JOB_STATUS.READY,
  );

  if (jobs.length === 0) {
    return;
  }

  console.log("[JobRunner] auto-start jobs", {
    count: jobs.length,
  });

  for (const job of jobs) {
    if (!runningCheck()) {
      return;
    }

    void executeJob(job.kanriNo).catch((error) => {
      console.error("[JobRunner] Auto-start FAILED", {
        kanriNo: job.kanriNo,
        error: error instanceof Error ? error.message : error,
      });
    });
  }
}
