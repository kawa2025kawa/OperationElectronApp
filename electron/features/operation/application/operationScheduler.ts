// electron/features/operation/application/operationScheduler.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import {
  getRegisteredTargets,
  getStatus,
  onReadyStatus,
  recalculateAllStatuses,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionService";
import { executeSingleScriptJob } from "@electron/features/operation/runners/scriptRunner";
import {
  JOB_STATUS,
  type JobResult,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import {
  syncReadyTrackerStatus,
  syncStatuses,
} from "./operationStatusEvaluator";

const POLLING_INTERVAL_MS = 60_000;
let pollingTimer: NodeJS.Timeout | null = null;
let isPollingActive = false;
let isCycleExecuting = false;
let unsubscribeReadyStatus: (() => void) | null = null;

const readyQueue: StatusTarget[] = [];
const queuedKanriNos = new Set<string>();
let isProcessingReadyQueue = false;

// 指定管理Noが実行可能（READY）ステータスかを判定する。
function isReady(kanriNo: string): boolean {
  return getStatus(kanriNo)?.status === JOB_STATUS.READY;
}

// スクリプト実行中ステータスを記録し単一スクリプトを実行して結果を反映する。
async function executeScript(
  kanriNo: string,
  scriptKey: string,
): Promise<JobResult> {
  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
  });

  try {
    const result = await executeSingleScriptJob(kanriNo, scriptKey);
    applyScriptExecutionResult(kanriNo, result);
    return result;
  } catch (error) {
    applyScriptExecutionError(kanriNo, error);
    throw error;
  }
}

// READY状態のジョブに紐づく自動実行スクリプトを順次実行する。
// エラーまたは要対応の結果が発生した場合は後続スクリプトを実行しない。
async function executeReadyJob(item: OperationViewItem): Promise<void> {
  const kanriNo = item.kanriNo;

  if (!isReady(kanriNo)) {
    return;
  }

  const scriptKeys = Array.isArray(item.ScriptKeys)
    ? item.ScriptKeys.filter((entry) => entry.executionTypes?.includes("auto"))
        .map((entry) => entry.key.trim())
        .filter(Boolean)
    : [];

  if (scriptKeys.length === 0) {
    return;
  }

  updateStatus({
    kanriNo,
    status: JOB_STATUS.RUNNING,
    startTime: new Date().toISOString(),
  });

  try {
    for (const scriptKey of scriptKeys) {
      const result = await executeScript(kanriNo, scriptKey);

      if (result.success === false || result.kind === "needsAction") {
        return;
      }
    }
  } catch (error) {
    console.error(
      `[Scheduler] ジョブ実行中に予期しないエラー (kanriNo=${kanriNo}):`,
      error,
    );
  }
}

// READYターゲットのTrackerステータスを事前確認した上でスクリプトを実行する。
async function processReadyTarget(target: StatusTarget): Promise<void> {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (!kanriNo || !isReady(kanriNo)) {
    return;
  }

  await syncReadyTrackerStatus(target);
  if (!isReady(kanriNo)) {
    return;
  }

  await executeReadyJob(target);
}

// READYジョブキューから順次ターゲットを取り出して実行処理を行う。
async function processReadyQueue(): Promise<void> {
  if (isProcessingReadyQueue) {
    return;
  }
  isProcessingReadyQueue = true;
  try {
    while (readyQueue.length > 0) {
      const target = readyQueue.shift()!;
      const kanriNo = normalizeKanriNo(target.kanriNo);
      queuedKanriNos.delete(kanriNo);
      if (!kanriNo) {
        continue;
      }
      try {
        await processReadyTarget(target);
      } catch (error) {
        console.error(
          `[Scheduler] READYジョブ処理失敗 (kanriNo=${kanriNo}):`,
          error,
        );
      }
    }
  } finally {
    isProcessingReadyQueue = false;
  }
}

// 実行可能（READY）ターゲットをキューに追加して処理を開始する。
function enqueueReadyTarget(target: StatusTarget): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (!kanriNo || !isReady(kanriNo) || queuedKanriNos.has(kanriNo)) {
    return;
  }

  queuedKanriNos.add(kanriNo);
  readyQueue.push(target);
  void processReadyQueue();
}

// 現在登録されている全ターゲットのうちREADY状態のものをキューへ投入する。
function enqueueCurrentReadyTargets(targets: StatusTarget[]): void {
  for (const target of targets) {
    enqueueReadyTarget(target);
  }
}

// 1回のポーリングサイクルとしてTracker同期、時間経過によるローカル判定更新、READYキュー投入を実行する。
async function runPollingCycle(): Promise<void> {
  if (isCycleExecuting || !isPollingActive) {
    return;
  }
  isCycleExecuting = true;
  try {
    const targets = getRegisteredTargets();
    if (targets.length === 0) {
      return;
    }
    // Tracker連携ターゲットの同期
    await syncStatuses(targets);

    // 時間経過（予定時刻到達）によるステータスの定期再判定
    recalculateAllStatuses();

    // READYターゲットのキュー投入
    enqueueCurrentReadyTargets(targets);
  } catch (error) {
    console.error("[Scheduler] ポーリングエラー:", error);
  } finally {
    isCycleExecuting = false;
    scheduleNextCycle();
  }
}

function scheduleNextCycle(): void {
  if (!isPollingActive) {
    return;
  }
  if (pollingTimer !== null) {
    clearTimeout(pollingTimer);
  }
  pollingTimer = setTimeout(() => {
    void runPollingCycle();
  }, POLLING_INTERVAL_MS);
}

// 定期ポーリングタイマーを開始しREADY通知リスナーを登録する。
export function startPolling(): void {
  if (isPollingActive) {
    return;
  }
  isPollingActive = true;
  unsubscribeReadyStatus = onReadyStatus(enqueueReadyTarget);
  void runPollingCycle();
}

// ポーリングタイマーを停止しキューとリスナーをクリーンアップする。
export function stopPolling(): void {
  isPollingActive = false;
  if (pollingTimer !== null) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  unsubscribeReadyStatus?.();
  unsubscribeReadyStatus = null;
  readyQueue.length = 0;
  queuedKanriNos.clear();
}
