//electron\features\operation\application\operationScheduler.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import {
  getRegisteredTargets,
  getStatus,
  onReadyStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

import { executeReadyJob } from "./operationJobExecutor";
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
          `[Scheduler] READY対象の処理に失敗しました (kanriNo=${kanriNo}):`,
          error,
        );
      }
    }
  } finally {
    isProcessingReadyQueue = false;
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
    console.error("[Scheduler] ポーリングサイクルエラー:", error);
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
