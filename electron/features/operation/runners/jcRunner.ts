// electron/features/operation/runners/jcRunner.ts

import { JOB_STATUS, type OperationItem } from "@shared/types/operation";
import {
  hasJobId,
  syncTrackerStatus,
} from "@electron/features/operation/polling/trackerMonitor";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";
import { cleanErrorMessage } from "@electron/features/operation/helpers/errorHelper";

const runningJcJobs = new Set<string>();
let isTriggeringJc = false;

export async function executeJcJob(item: OperationItem): Promise<void> {
  const kanriNo = String(item.kanriNo).trim();
  if (!kanriNo || runningJcJobs.has(kanriNo)) return;

  const jobId = "jobId" in item ? item.jobId : undefined;
  runningJcJobs.add(kanriNo);
  const startTime = new Date().toISOString();

  try {
    console.log(
      `[JcRunner] Triggering JC Job: No.${kanriNo} (jobId: ${jobId ?? "N/A"})`,
    );

    // 🎯 即座に RUNNING へ上書き固定（評価エンジンによる scheduled へのバタつき・逆行を阻止）
    updateStatus({
      kanriNo,
      status: JOB_STATUS.RUNNING,
      comment: "JC実行中...",
      startTime,
    });

    // 💡 注意: 以前ここに存在した setTimeout 内の syncTrackerStatus(item) は
    // executeJcJobImmediately 側で同期済みのため、重複呼び出し（二重リクエスト）防止で完全に削除しました。
  } catch (error) {
    console.error(`[JcRunner] JC Job FAILED: No.${kanriNo}`, error);
    const formattedError = cleanErrorMessage(error);
    const endTime = new Date().toISOString();

    updateStatus({
      kanriNo,
      status: JOB_STATUS.ERROR,
      comment: `JC起動失敗: ${formattedError}`,
      startTime,
      endTime,
    });
  } finally {
    runningJcJobs.delete(kanriNo);
  }
}

/**
 * ⚡【イベント駆動】READYステータス検知時の即時API確認および起動
 */
export async function executeJcJobImmediately(
  item: OperationItem,
): Promise<void> {
  if (!hasJobId(item)) return;

  const kanriNo = String(item.kanriNo).trim();
  if (runningJcJobs.has(kanriNo)) return;

  // 1. まず現在の Tracker API の状態を取得して最新化
  await syncTrackerStatus(item);

  // 2. API 問い合わせ後、バックエンド側で未完了かつ READY の場合のみ自動起動
  const currentStatus = getStatus(kanriNo)?.status;
  if (currentStatus === JOB_STATUS.READY) {
    await executeJcJob(item);
  }
}

/**
 * ⏰【タイマー駆動】60秒周期の定期チェック（取りこぼし防止）
 */
export async function triggerAutoStartJcJobs(
  targets: OperationItem[],
  runningCheck: () => boolean,
): Promise<void> {
  if (isTriggeringJc || !runningCheck()) return;
  isTriggeringJc = true;

  try {
    for (const item of targets) {
      if (!runningCheck()) break;

      const kanriNo = String(item.kanriNo).trim();
      const currentStatus = getStatus(kanriNo)?.status;

      if (
        currentStatus === JOB_STATUS.READY &&
        hasJobId(item) &&
        !runningJcJobs.has(kanriNo)
      ) {
        void executeJcJob(item);
      }
    }
  } finally {
    isTriggeringJc = false;
  }
}
