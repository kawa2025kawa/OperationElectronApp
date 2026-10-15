// electron/features/operation/application/operationScheduler.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import {
  getRegisteredTargets,
  getStatus,
  onReadyStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionStatus";
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
let isPolling = false;
let unsubscribeReadyStatus: (() => void) | null = null;

const readyQueue: StatusTarget[] = [];
const queuedKanriNos = new Set<string>();
let isProcessingReadyQueue = false;

function isReady(kanriNo: string): boolean {
  return getStatus(kanriNo)?.status === JOB_STATUS.READY;
}

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

async function executeReadyJob(item: OperationViewItem): Promise<void> {
  const kanriNo = item.kanriNo;

  if (!isReady(kanriNo)) {
    return;
  }

  if (!("Script" in item) || item.Script !== true) {
    return;
  }

  const scriptKeys = Array.isArray(item.ScriptKeys)
    ? item.ScriptKeys.filter((entry) => entry.executionType === "auto")
        .map((entry) => entry.key)
        .filter((key) => key.trim() !== "")
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
      if (result.success === false) {
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

function enqueueReadyTarget(target: StatusTarget): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (!kanriNo || !isReady(kanriNo) || queuedKanriNos.has(kanriNo)) {
    return;
  }

  queuedKanriNos.add(kanriNo);
  readyQueue.push(target);
  void processReadyQueue();
}

function enqueueCurrentReadyTargets(targets: StatusTarget[]): void {
  for (const target of targets) {
    enqueueReadyTarget(target);
  }
}

async function runPollingCycle(): Promise<void> {
  if (isPolling) {
    return;
  }
  isPolling = true;
  try {
    const targets = getRegisteredTargets();
    if (targets.length === 0) {
      return;
    }
    await syncStatuses(targets);
    enqueueCurrentReadyTargets(targets);
  } catch (error) {
    console.error("[Scheduler] ポーリングエラー:", error);
  } finally {
    isPolling = false;
  }
}

export function startPolling(): void {
  if (pollingTimer !== null) {
    return;
  }
  unsubscribeReadyStatus = onReadyStatus(enqueueReadyTarget);
  void runPollingCycle();
  pollingTimer = setInterval(() => void runPollingCycle(), POLLING_INTERVAL_MS);
}

export function stopPolling(): void {
  if (pollingTimer === null) {
    return;
  }
  clearInterval(pollingTimer);
  pollingTimer = null;
  unsubscribeReadyStatus?.();
  unsubscribeReadyStatus = null;
  readyQueue.length = 0;
  queuedKanriNos.clear();
}
