// electron/features/operation/jobRunner.ts

import {
  JOB_STATUS,
  type JobResult,
  type OperationItem,
} from "@shared/types/operation";
import { dispatchScript } from "@electron/features/operation/jobs/scripts";
import { hasJobId } from "@electron/features/operation/polling";

import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

const runningJobs = new Set<string>();

const cleanErrorMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error))
    .replace(/^Error invoking remote method '[^']+':\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();

export async function executeJob(
  rawKanriNo: string | number,
  filePath?: string | string[],
): Promise<JobResult> {
  const kanriNo = String(rawKanriNo).trim();

  // DEBUG: executeJob の呼び出しパラメータを出力
  console.log("[executeJob DEBUG]", {
    rawKanriNo,
    kanriNo,
    filePath,
  });

  if (!kanriNo) throw new Error("kanriNo is required");
  if (runningJobs.has(kanriNo)) throw new Error(`実行中: No.${kanriNo}`);

  runningJobs.add(kanriNo);

  const isReadOnlyCheckJob = kanriNo.toUpperCase().endsWith("_CHECK");
  const startTime = new Date().toISOString();

  try {
    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.SCRIPT_RUNNING,
        comment: "実行中...",
        startTime,
      });
    }

    // DSI8020 のステータスを取得し、スクリプトへの引数オプションとして渡す
    const dsi8020Item = getStatus("DSI8020");
    const scriptOptions = {
      dsi8020Status: dsi8020Item?.status ?? undefined,
    };

    const result = await dispatchScript(kanriNo, filePath, scriptOptions);
    const endTime = new Date().toISOString();

    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.SUCCESS,
        comment: result.message,
        startTime,
        endTime,
      });
    }

    return result;
  } catch (error) {
    console.error("[executeJob ERROR]", {
      kanriNo,
      error,
    });

    const formattedError = cleanErrorMessage(error);
    const endTime = new Date().toISOString();

    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.ERROR,
        comment: formattedError,
        startTime,
        endTime,
      });
    }

    throw new Error(formattedError, { cause: error });
  } finally {
    runningJobs.delete(kanriNo);
  }
}

export async function triggerAutoStartJobs(
  targets: OperationItem[],
  runningCheck: () => boolean,
): Promise<void> {
  // 🎯 変更前: t.autoStart === true
  // 🎯 変更後: scripts 配列内のいずれかの要素が autoStart === true かどうか判定
  const jobs = targets.filter(
    (t) =>
      t.scripts?.some((s) => s.autoStart === true) &&
      !hasJobId(t) &&
      getStatus(t.kanriNo)?.status === JOB_STATUS.READY,
  );

  for (const job of jobs) {
    if (!runningCheck()) return;
    void executeJob(job.kanriNo).catch((error) => {
      console.error("[JobRunner] Auto-start FAILED", {
        kanriNo: job.kanriNo,
        error: cleanErrorMessage(error),
      });
    });
  }
}
