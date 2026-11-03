// electron/features/operation/application/operationScheduler.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { getScriptKeysForOperation } from "@electron/features/operation/runners/operationScriptRegistry";
import {
  getRegisteredTargets,
  getStatus,
  onReadyStatus,
  recalculateAllStatuses,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { executeScriptAndApplyStatus } from "@electron/features/operation/application/scriptExecutionService";
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

const isReady = (kanriNo: string): boolean =>
  getStatus(kanriNo)?.status === JOB_STATUS.READY;

async function executeScript(
  kanriNo: string,
  scriptKey: string,
): Promise<JobResult> {
  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
  });
  return executeScriptAndApplyStatus(kanriNo, () =>
    executeSingleScriptJob(kanriNo, scriptKey),
  );
}

async function executeReadyJob(item: OperationViewItem): Promise<void> {
  const { kanriNo } = item;
  if (!isReady(kanriNo)) return;

  const scriptKeys = getScriptKeysForOperation(kanriNo, item.ScriptKeys)
    .filter((e) => e.executionTypes?.includes("auto"))
    .map((e) => e.key.trim())
    .filter(Boolean);

  if (scriptKeys.length === 0) return;

  updateStatus({
    kanriNo,
    status: JOB_STATUS.RUNNING,
    startTime: new Date().toISOString(),
  });
  try {
    for (const key of scriptKeys) {
      const result = await executeScript(kanriNo, key);
      if (result.success === false || result.kind === "needsAction") return;
    }
  } catch (error) {
    console.error(
      `[Scheduler] ジョブ実行中に予期しないエラー (kanriNo=${kanriNo}):`,
      error,
    );
  }
}

async function processReadyTarget(target: StatusTarget): Promise<void> {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (!kanriNo || !isReady(kanriNo)) return;

  await syncReadyTrackerStatus(target);
  if (isReady(kanriNo)) {
    await executeReadyJob(target);
  }
}

async function processReadyQueue(): Promise<void> {
  if (isProcessingReadyQueue) return;
  isProcessingReadyQueue = true;
  try {
    while (readyQueue.length > 0) {
      const target = readyQueue.shift()!;
      const kanriNo = normalizeKanriNo(target.kanriNo);
      queuedKanriNos.delete(kanriNo);
      if (!kanriNo) continue;

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

function enqueueReadyTarget(target: StatusTarget): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (!kanriNo || !isReady(kanriNo) || queuedKanriNos.has(kanriNo)) return;

  queuedKanriNos.add(kanriNo);
  readyQueue.push(target);
  void processReadyQueue();
}

async function runPollingCycle(): Promise<void> {
  if (isCycleExecuting || !isPollingActive) return;
  isCycleExecuting = true;
  try {
    const targets = getRegisteredTargets();
    if (targets.length > 0) {
      await syncStatuses(targets);
      recalculateAllStatuses();
      for (const target of targets) enqueueReadyTarget(target);
    }
  } catch (error) {
    console.error("[Scheduler] ポーリングエラー:", error);
  } finally {
    isCycleExecuting = false;
    scheduleNextCycle();
  }
}

function scheduleNextCycle(): void {
  if (!isPollingActive) return;
  if (pollingTimer !== null) clearTimeout(pollingTimer);
  pollingTimer = setTimeout(() => void runPollingCycle(), POLLING_INTERVAL_MS);
}

export function startPolling(): void {
  if (isPollingActive) return;
  isPollingActive = true;
  unsubscribeReadyStatus = onReadyStatus(enqueueReadyTarget);
  void runPollingCycle();
}

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
