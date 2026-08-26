//electron\features\operation\jobRunner.ts

import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { dispatchScript } from "@electron/features/operation/jobs/scripts";
import { hasJobId } from "@electron/features/operation/monitors/trackerMonitor";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

const runningJobs = new Set<string>();

/**
 * IPC通信やErrorオブジェクトの冗長な接頭辞を除去
 */
function cleanErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

/**
 * 指定管理番号のジョブを実行
 * @param rawKanriNo 管理番号
 * @param filePath 単一または複数のファイルパス
 */
export async function executeJob(
  rawKanriNo: string | number,
  filePath?: string | string[],
): Promise<string> {
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

    // dispatchScript へ filePath (string | string[]) を委譲
    const result = await dispatchScript(kanriNo, filePath);

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
    const formattedError = cleanErrorMessage(error);

    updateStatus({
      kanriNo,
      status: JOB_STATUS.ERROR,
      comment: formattedError,
      startTime,
      endTime: new Date().toISOString(),
    });

    console.error(`[JobRunner] failed: ${kanriNo}`, formattedError);

    throw new Error(formattedError, { cause: error });
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
  const jobs = targets.filter(
    (target) =>
      target.autoStart === true &&
      !hasJobId(target) &&
      getStatus(target.kanriNo)?.status === JOB_STATUS.READY,
  );

  if (jobs.length === 0) return;

  console.log("[JobRunner] auto-start jobs", { count: jobs.length });

  for (const job of jobs) {
    if (!runningCheck()) return;

    // executeJob 側で整形済みのエラーが返るため、そのまま受ける
    executeJob(job.kanriNo).catch((error) => {
      console.error("[JobRunner] Auto-start FAILED", {
        kanriNo: job.kanriNo,
        error: error instanceof Error ? error.message : error,
      });
    });
  }
}
