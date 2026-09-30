// electron/features/operation/statusManager.ts

import { BrowserWindow } from "electron";

import { getActiveFlags } from "@electron/features/operation/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/helpers/operationUtils";
import { calculateJobStatus } from "@electron/features/operation/helpers/statusCalculator";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/helpers/statusStorage";
import { getDependencyMasters } from "@electron/features/operation/services/operationMasterService";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { normalizeDependencies } from "@shared/utils/dependency/dependencyUtils";
import type {
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Types
 * ========================= */

export type StatusTarget = OperationMaster | TodayIrregularMaster;

export type ReadyStatusListener = (target: StatusTarget) => void;

type StatusMap = Record<string, OperationStatusState>;

type StatusClearPayload = {
  kanriNo: string;
  status: undefined;
  comment: string;
};

type StatusNotification = OperationStatusState | StatusClearPayload;

/* =========================
 * State
 * ========================= */

const targets = new Map<string, StatusTarget>();

const statuses = new Map<string, OperationStatusState>();

const dependentTargets = new Map<string, Set<string>>();

const readyStatusListeners = new Set<ReadyStatusListener>();

const propagationQueue = new Set<string>();

let isPropagating = false;

/* =========================
 * Status Rules
 * ========================= */

const PROTECTED_STATUSES = new Set<JobStatus>([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.ERROR,
]);

function isProtectedStatus(status?: JobStatus): boolean {
  return status !== undefined && PROTECTED_STATUSES.has(status);
}

function isRunningStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

/* =========================
 * Status Merge
 * ========================= */

function mergeStatus(
  current: OperationStatusState | undefined,
  update: OperationStatusState,
): OperationStatusState {
  return {
    ...current,
    ...update,
    kanriNo: update.kanriNo,
    status: update.status ?? current?.status,
    comment: update.comment ?? current?.comment ?? "",
  };
}

function hasStatusChanged(
  previous: OperationStatusState | undefined,
  next: OperationStatusState,
): boolean {
  if (!previous) {
    return true;
  }

  return (
    previous.status !== next.status ||
    previous.comment !== next.comment ||
    previous.startTime !== next.startTime ||
    previous.endTime !== next.endTime ||
    previous.expectedStartTime !== next.expectedStartTime ||
    previous.expectedEndTime !== next.expectedEndTime ||
    previous.substatus !== next.substatus ||
    previous.info !== next.info
  );
}

/* =========================
 * Default Status
 * ========================= */

function createScheduledStatus(kanriNo: string): OperationStatusState {
  return {
    kanriNo,
    status: JOB_STATUS.SCHEDULED,
    comment: "予定時刻待ち",
    startTime: null,
    endTime: null,
  };
}

/* =========================
 * Dependency Index
 * ========================= */

function registerDependencyIndex(target: StatusTarget): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  if (!kanriNo) {
    return;
  }

  const dependencies = normalizeDependencies(target.dependsOn);

  for (const dependency of dependencies) {
    const dependencyNo = normalizeKanriNo(dependency);

    if (!dependencyNo) {
      continue;
    }

    const dependents = dependentTargets.get(dependencyNo) ?? new Set<string>();

    dependents.add(kanriNo);

    dependentTargets.set(dependencyNo, dependents);
  }
}

function rebuildDependencyIndex(): void {
  dependentTargets.clear();

  for (const target of targets.values()) {
    registerDependencyIndex(target);
  }
}

function enqueueDependents(kanriNo: string): void {
  const dependents = dependentTargets.get(kanriNo);

  if (!dependents) {
    return;
  }

  for (const dependent of dependents) {
    propagationQueue.add(dependent);
  }
}

function enqueueAllRecalculableTargets(): void {
  for (const [kanriNo, status] of statuses) {
    if (!targets.has(kanriNo)) {
      continue;
    }

    if (isProtectedStatus(status.status)) {
      continue;
    }

    propagationQueue.add(kanriNo);
  }
}

/* =========================
 * Dependency Status Snapshot
 * ========================= */

export function getDependencyStatuses(): {
  operationStatuses: StatusMap;
  irregularStatuses: StatusMap;
  todayStatuses: StatusMap;
} {
  const operationStatuses: StatusMap = {};

  const irregularStatuses: StatusMap = {};

  const todayStatuses: StatusMap = {};

  for (const [kanriNo, status] of statuses) {
    const target = targets.get(kanriNo);

    if (!target) {
      continue;
    }

    if ("jobId" in target) {
      operationStatuses[kanriNo] = status;
    } else {
      todayStatuses[kanriNo] = status;
    }
  }

  return {
    operationStatuses,
    irregularStatuses,
    todayStatuses,
  };
}

/* =========================
 * Renderer Notification
 * ========================= */

function notifyRenderer(payload: StatusNotification): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) {
      continue;
    }

    window.webContents.send("operation:status-updated", payload);
  }
}

function notifyStatusUpdated(status: OperationStatusState): void {
  notifyRenderer(status);
}

function notifyStatusCleared(kanriNo: string): void {
  notifyRenderer({
    kanriNo,
    status: undefined,
    comment: "",
  });
}

/* =========================
 * READY Notification
 * ========================= */

function notifyReady(target: StatusTarget): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  console.log("[StatusManager] READY通知:", {
    kanriNo,
    status: statuses.get(kanriNo)?.status,
    time: new Date().toISOString(),
  });

  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusManager] READY listener error:", error);
    }
  }
}

function calculateTargetStatus(target: StatusTarget): OperationStatusState {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  const result = calculateJobStatus(
    target,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  return {
    kanriNo,
    status: result.status,
    comment: result.comment,
  };
}

function recalculateTargetStatus(kanriNo: string): void {
  const target = targets.get(kanriNo);

  if (!target) {
    return;
  }

  const current = statuses.get(kanriNo);

  if (isProtectedStatus(current?.status)) {
    return;
  }

  const calculatedStatus = calculateTargetStatus(target);

  applyStatus(calculatedStatus);
}

function processDependencyPropagation(): void {
  if (isPropagating) {
    return;
  }

  isPropagating = true;

  try {
    while (propagationQueue.size > 0) {
      const queue = [...propagationQueue];

      propagationQueue.clear();

      for (const kanriNo of queue) {
        recalculateTargetStatus(kanriNo);
      }
    }
  } finally {
    isPropagating = false;
  }
}

function applyStatus(update: OperationStatusState): boolean {
  const kanriNo = normalizeKanriNo(update.kanriNo);

  if (!kanriNo) {
    return false;
  }

  const previous = statuses.get(kanriNo);

  const next = mergeStatus(previous, {
    ...update,
    kanriNo,
  });

  if (!hasStatusChanged(previous, next)) {
    return true;
  }

  statuses.set(kanriNo, next);

  persistStatusesDebounced(statuses);

  notifyStatusUpdated(next);

  if (
    next.status === JOB_STATUS.READY &&
    previous?.status !== JOB_STATUS.READY
  ) {
    const target = targets.get(kanriNo);

    if (target) {
      notifyReady(target);
    }
  }

  enqueueDependents(kanriNo);

  processDependencyPropagation();

  return true;
}

/* =========================
 * Public Status API
 * ========================= */

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...targets.values()];
}

export function updateStatus(update: OperationStatusState): boolean {
  return applyStatus(update);
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment = "",
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);

  if (!normalizedKanriNo) {
    return false;
  }

  return updateStatus({
    kanriNo: normalizedKanriNo,
    status,
    comment,
  });
}

/* =========================
 * Target Registration
 * ========================= */

export function registerTargets(targetList: StatusTarget[]): void {
  console.log(
    "[StatusManager] registerTargets:",
    targetList.length,
    targetList.map(({ kanriNo }) => kanriNo),
  );

  const masters = getDependencyMasters();

  const dependencyStatuses = getDependencyStatuses();

  for (const target of targetList) {
    const kanriNo = normalizeKanriNo(target.kanriNo);

    if (!kanriNo) {
      continue;
    }

    targets.set(kanriNo, target);

    if (statuses.has(kanriNo)) {
      continue;
    }

    const result = calculateJobStatus(target, masters, dependencyStatuses);

    applyStatus({
      kanriNo,
      status: result.status,
      comment: result.comment,
    });
  }

  rebuildDependencyIndex();

  enqueueAllRecalculableTargets();

  processDependencyPropagation();

  console.log("[StatusManager] registered targets:", targets.size);

  persistStatusesDebounced(statuses);
}

/* =========================
 * Initialization
 * ========================= */

export async function initializeStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  const persistedStatuses = await loadStatusesFromFile();

  statuses.clear();

  let recoveredRunningStatus = false;

  for (const [kanriNo, status] of Object.entries(persistedStatuses)) {
    const normalizedKanriNo = normalizeKanriNo(kanriNo);

    if (!normalizedKanriNo) {
      continue;
    }

    if (isRunningStatus(status.status)) {
      statuses.set(normalizedKanriNo, createScheduledStatus(normalizedKanriNo));

      recoveredRunningStatus = true;

      continue;
    }

    statuses.set(normalizedKanriNo, {
      ...status,
      kanriNo: normalizedKanriNo,
    });
  }

  if (recoveredRunningStatus) {
    persistStatusesDebounced(statuses);
  }

  return Object.fromEntries(statuses);
}

/* =========================
 * Reset
 * ========================= */

export function resetAllStatusesToScheduled(): Record<
  string,
  OperationStatusState
> {
  propagationQueue.clear();

  const kanriNos = [...statuses.keys()];

  for (const kanriNo of kanriNos) {
    applyStatus({
      kanriNo,
      status: JOB_STATUS.SCHEDULED,
      comment: "予定時刻待ち",
    });
  }

  persistStatusesImmediately(statuses);

  return Object.fromEntries(statuses);
}

/* =========================
 * Delete
 * ========================= */

export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...targets.keys()];

  propagationQueue.clear();
  statuses.clear();

  persistStatusesImmediately(statuses);

  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

/* =========================
 * Persistence
 * ========================= */

export function persistStatuses(): void {
  persistStatusesImmediately(statuses);
}

/* =========================
 * Clear
 * ========================= */

export function clearStatuses(): void {
  statuses.clear();
  targets.clear();
  dependentTargets.clear();
  propagationQueue.clear();
}

/* =========================
 * Dependency Refresh
 * ========================= */

export function refreshDependencyStatuses(): void {
  propagationQueue.clear();

  enqueueAllRecalculableTargets();

  processDependencyPropagation();
}

export function refreshScheduledStatuses(): void {
  propagationQueue.clear();

  for (const [kanriNo, status] of statuses) {
    if (
      status.status === JOB_STATUS.SCHEDULED ||
      status.status === JOB_STATUS.WAITING
    ) {
      propagationQueue.add(kanriNo);
    }
  }

  processDependencyPropagation();
}

/* =========================
 * READY Listener
 * ========================= */

export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}
