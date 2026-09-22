import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import {
  getAllTargets,
  getStatus,
  setStatusChangedHandler,
  updateStatus,
} from "@electron/features/operation/statusManager";
import { executeScriptJobImmediately } from "@electron/features/operation/runners/scriptRunner";
import {
  hasJobId,
  syncTrackerStatus,
} from "@electron/features/operation/services/trackerServiceClient";
import {
  isRunningStatus,
  isTerminalStatus,
} from "@shared/utils/statusUtils";
import { calculateJobStatus } from "@shared/utils/dependency/statusCalculator";
import { normalizeDependencies } from "@shared/utils/dependency/dependencyUtils";

const RECONCILIATION_INTERVAL_MS = 60_000;

let pollingRunning = false;
let reconciliationTimer: NodeJS.Timeout | null = null;

const jobQueue: string[] = [];
const queuedJobs = new Set<string>();
const runningJobs = new Set<string>();

let workerRunning = false;

interface DependencyStatusUpdate {
  kanriNo: string;
  status: JobStatus;
  comment: string;
}

function isReadyStatus(
  status?: JobStatus,
): boolean {
  return status === JOB_STATUS.READY;
}

function setPollingRunning(
  value: boolean,
): void {
  pollingRunning = value;
}

function isPollingRunning(): boolean {
  return pollingRunning;
}

function createEntityMap(
  targets: OperationItem[],
): Record<string, OperationItem> {
  return Object.fromEntries(
    targets.map((item) => [
      String(item.kanriNo).trim(),
      item,
    ]),
  );
}

function getDirectDependentItems(
  changedKanriNo: string,
  entities: Record<string, OperationItem>,
): OperationItem[] {
  return Object.values(entities).filter(
    (item) => {
      const dependsOn =
        normalizeDependencies(
          item.dependency?.dependsOn,
        );

      return dependsOn.includes(
        changedKanriNo,
      );
    },
  );
}

function resolveDependents(
  changedKanriNo: string | number,
  targets: OperationItem[],
): DependencyStatusUpdate[] {
  const targetId =
    String(changedKanriNo).trim();

  if (!targetId) return [];

  const entities =
    createEntityMap(targets);

  const dependentItems =
    getDirectDependentItems(
      targetId,
      entities,
    );

  if (dependentItems.length === 0) {
    return [];
  }

  const updates: DependencyStatusUpdate[] =
    [];

  for (const item of dependentItems) {
    if (
      isTerminalStatus(item.status) ||
      isRunningStatus(item.status)
    ) {
      continue;
    }

    const result =
      calculateJobStatus(
        item,
        entities,
      );

    if (
      item.status === result.status &&
      item.comment === result.comment
    ) {
      continue;
    }

    const update: DependencyStatusUpdate = {
      kanriNo: String(item.kanriNo),
      status: result.status,
      comment: result.comment,
    };

    console.log(
      `[Scheduler] Dependency No.${update.kanriNo}: ` +
        `${item.status} -> ${update.status}`,
    );

    if (!updateStatus(update)) {
      continue;
    }

    updates.push(update);

    entities[update.kanriNo] = {
      ...item,
      status: update.status,
      comment: update.comment,
    };
  }

  return updates;
}

function reconcileAllStatuses(
  targets: OperationItem[],
): DependencyStatusUpdate[] {
  const entities =
    createEntityMap(targets);

  const updates: DependencyStatusUpdate[] =
    [];

  const maxPasses =
    Math.max(1, targets.length);

  for (
    let pass = 0;
    pass < maxPasses;
    pass += 1
  ) {
    let changed = false;

    for (const item of Object.values(entities)) {
      if (
        isTerminalStatus(item.status) ||
        isRunningStatus(item.status)
      ) {
        continue;
      }

      const result =
        calculateJobStatus(
          item,
          entities,
        );

      if (
        item.status === result.status &&
        item.comment === result.comment
      ) {
        continue;
      }

      const update: DependencyStatusUpdate = {
        kanriNo: String(item.kanriNo),
        status: result.status,
        comment: result.comment,
      };

      if (!updateStatus(update)) {
        continue;
      }

      console.log(
        `[Scheduler] Reconcile No.${update.kanriNo}: ` +
          `${item.status} -> ${update.status}`,
      );

      entities[update.kanriNo] = {
        ...item,
        status: update.status,
        comment: update.comment,
      };

      updates.push(update);
      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  return updates;
}

function enqueueJob(
  kanriNo: string | number,
): void {
  const key =
    String(kanriNo).trim();

  if (!key) return;
  if (queuedJobs.has(key)) return;
  if (runningJobs.has(key)) return;

  const status =
    getStatus(key)?.status;

  if (!isReadyStatus(status)) {
    return;
  }

  queuedJobs.add(key);
  jobQueue.push(key);

  void processQueue();
}

function enqueueAllReadyJobs(): void {
  for (const target of getAllTargets()) {
    const kanriNo =
      String(target.kanriNo).trim();

    if (!kanriNo) continue;

    const status =
      getStatus(kanriNo)?.status ??
      target.status;

    if (isReadyStatus(status)) {
      enqueueJob(kanriNo);
    }
  }
}

async function processQueue(): Promise<void> {
  if (workerRunning) return;
  if (!isPollingRunning()) return;

  workerRunning = true;

  try {
    while (
      isPollingRunning() &&
      jobQueue.length > 0
    ) {
      const kanriNo =
        jobQueue.shift();

      if (!kanriNo) continue;

      queuedJobs.delete(kanriNo);

      if (runningJobs.has(kanriNo)) {
        continue;
      }

      const status =
        getStatus(kanriNo)?.status;

      if (!isReadyStatus(status)) {
        continue;
      }

      runningJobs.add(kanriNo);

      try {
        await executeReadyJob(
          kanriNo,
        );
      } finally {
        runningJobs.delete(kanriNo);
      }
    }
  } finally {
    workerRunning = false;

    if (
      isPollingRunning() &&
      jobQueue.length > 0
    ) {
      void processQueue();
    }
  }
}

async function executeReadyJob(
  kanriNo: string,
): Promise<void> {
  if (!isPollingRunning()) return;

  const target =
    getAllTargets().find(
      (item) =>
        String(item.kanriNo).trim() ===
        kanriNo,
    );

  if (!target) return;

  const status =
    getStatus(kanriNo)?.status ??
    target.status;

  if (!isReadyStatus(status)) {
    return;
  }

  console.log(
    `[Scheduler] ▶️ READY処理開始 -> No.${kanriNo} (${target.workName ?? ""})`,
  );

  try {
    if (hasJobId(target)) {
      // JC = Tracker API問い合わせ → UI用Statusへ反映
      await syncTrackerStatus(
        target,
      );
    } else if (
      target.executionType ===
      "autoScript"
    ) {
      await executeScriptJobImmediately(
        target,
      );
    }

    console.log(
      `[Scheduler] ✅ READY処理完了 -> No.${kanriNo}`,
    );
  } catch (error) {
    console.error(
      `[Scheduler] ❌ READY処理失敗 -> No.${kanriNo}`,
      error,
    );
  }
}

function evaluateAffectedJobs(
  changedKanriNo: string | number,
): void {
  if (!isPollingRunning()) return;

  const targets =
    getAllTargets();

  const updates =
    resolveDependents(
      changedKanriNo,
      targets,
    );

  for (const update of updates) {
    if (
      isReadyStatus(update.status)
    ) {
      enqueueJob(
        update.kanriNo,
      );
    }
  }

  const changedStatus =
    getStatus(changedKanriNo)
      ?.status;

  if (
    isReadyStatus(changedStatus)
  ) {
    enqueueJob(changedKanriNo);
  }
}

function runReconciliation(): void {
  if (!isPollingRunning()) return;

  console.log(
    "[Scheduler] 🔄 60秒Reconciliation開始",
  );

  const targets =
    getAllTargets();

  const updates =
    reconcileAllStatuses(
      targets,
    );

  for (const update of updates) {
    if (
      isReadyStatus(update.status)
    ) {
      enqueueJob(
        update.kanriNo,
      );
    }
  }

  enqueueAllReadyJobs();
  scheduleNextTimer();
}

function clearNextTimer(): void {
  if (!reconciliationTimer) {
    return;
  }

  clearTimeout(
    reconciliationTimer,
  );

  reconciliationTimer = null;
}

export function scheduleNextTimer(): void {
  clearNextTimer();

  if (!isPollingRunning()) {
    return;
  }

  reconciliationTimer =
    setTimeout(() => {
      reconciliationTimer = null;
      runReconciliation();
    }, RECONCILIATION_INTERVAL_MS);
}

export function onStatusChangedEvent(
  triggerReason?: string | number,
): void {
  console.log(
    `[Scheduler] ⚡ イベント検知 -> Trigger=${triggerReason ?? "UNKNOWN"}, polling=${isPollingRunning()}`,
  );

  if (!isPollingRunning()) {
    return;
  }

  if (
    String(triggerReason) ===
    "START_POLLING"
  ) {
    enqueueAllReadyJobs();
    scheduleNextTimer();
    return;
  }

  evaluateAffectedJobs(
    String(triggerReason ?? ""),
  );
}

export function startPolling(): void {
  if (isPollingRunning()) {
    return;
  }

  setPollingRunning(true);

  setStatusChangedHandler(
    onStatusChangedEvent,
  );

  console.log(
    "[Polling] ポーリングを開始しました（タイマー＆イベント監視モード）。",
  );

  onStatusChangedEvent(
    "START_POLLING",
  );
}

export function stopPolling(): void {
  if (!isPollingRunning()) {
    return;
  }

  setPollingRunning(false);
  setStatusChangedHandler(null);
  stopScheduler();

  console.log(
    "[Polling] ポーリングを停止しました。",
  );
}

export function stopScheduler(): void {
  clearNextTimer();

  jobQueue.length = 0;
  queuedJobs.clear();

  console.log(
    "[Scheduler] ⏹ Scheduler停止",
  );
}