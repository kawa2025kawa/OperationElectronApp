// electron/features/operation/application/statusManager.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  isOperationMasterTarget,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import { calculateJobStatus } from "@electron/features/operation/domain/statusCalculator";
import {
  createScheduledStatus,
  hasStatusChanged,
  isProtectedStatus,
  isRunningStatus,
  mergeStatus,
} from "@electron/features/operation/domain/statusRules";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";

import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";

import { DependencyPropagator } from "./dependencyPropagator";
import {
  notifyReady,
  notifyStatusCleared,
  notifyStatusUpdated,
  onReadyStatus,
  type ReadyStatusListener,
  type StatusTarget,
} from "./statusNotifier";
import { statusStore } from "./statusStore";

export type { StatusTarget, ReadyStatusListener };
export { onReadyStatus };

type StatusMap = Record<string, OperationStatusState>;

const propagator = new DependencyPropagator();

export function getDependencyMasters() {
  return statusStore.dependencyMasters;
}

function calculateTargetStatus(target: StatusTarget): OperationStatusState {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  const result = calculateJobStatus(
    target,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  return { kanriNo, status: result.status, comment: result.comment };
}

function recalculateTargetStatus(kanriNo: string): void {
  const target = statusStore.targets.get(kanriNo);
  if (!target) return;

  const current = statusStore.statuses.get(kanriNo);
  if (isProtectedStatus(current?.status)) return;

  const result = calculateTargetStatus(target);

  if (kanriNo === "E23") {
    console.log("[Status][E23] recalculateTargetStatus", {
      currentStatus: current?.status,
      scheduledTime: target.scheduledTime,
      dependsOn: target.dependsOn,
      calculatedStatus: result.status,
      calculatedComment: result.comment,
    });
  }

  applyStatus(result);
}

function applyStatus(update: OperationStatusState): boolean {
  const kanriNo = normalizeKanriNo(update.kanriNo);
  if (!kanriNo) return false;

  const previous = statusStore.statuses.get(kanriNo);
  const next = mergeStatus(previous, { ...update, kanriNo });

  if (!hasStatusChanged(previous, next)) return true;

  statusStore.statuses.set(kanriNo, next);
  persistStatusesDebounced(statusStore.statuses);
  notifyStatusUpdated(next);

  if (
    next.status === JOB_STATUS.READY &&
    previous?.status !== JOB_STATUS.READY
  ) {
    const target = statusStore.targets.get(kanriNo);
    if (target) notifyReady(target);
  }

  propagator.enqueueDependents(kanriNo);
  propagator.processPropagation(recalculateTargetStatus);

  return true;
}

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statusStore.statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return statusStore.targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...statusStore.targets.values()];
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
  if (!normalizedKanriNo) return false;

  return updateStatus({
    kanriNo: normalizedKanriNo,
    status,
    comment,
  });
}

export function getDependencyStatuses(): {
  operationStatuses: StatusMap;
  irregularStatuses: StatusMap;
  todayStatuses: StatusMap;
} {
  const operationStatuses: StatusMap = {};
  const irregularStatuses: StatusMap = {};
  const todayStatuses: StatusMap = {};

  for (const [kanriNo, status] of statusStore.statuses) {
    const target = statusStore.targets.get(kanriNo);
    if (!target) continue;

    if (isOperationMasterTarget(target)) {
      operationStatuses[kanriNo] = status;
    } else {
      todayStatuses[kanriNo] = status;
    }
  }

  return { operationStatuses, irregularStatuses, todayStatuses };
}

export function registerTargets(
  targetList: StatusTarget[],
  masterData: MasterData,
): void {
  statusStore.setDependencyMasters(masterData);

  const masters = getDependencyMasters();
  const dependencyStatuses = getDependencyStatuses();

  for (const target of targetList) {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) continue;

    statusStore.targets.set(kanriNo, target);
    if (statusStore.statuses.has(kanriNo)) continue;

    const result = calculateJobStatus(target, masters, dependencyStatuses);

    applyStatus({
      kanriNo,
      status: result.status,
      comment: result.comment,
    });
  }

  propagator.rebuildDependencyIndex(statusStore.targets.values());
  propagator.enqueueAllRecalculableTargets(
    statusStore.statuses,
    statusStore.targets,
  );
  propagator.processPropagation(recalculateTargetStatus);
  persistStatusesDebounced(statusStore.statuses);
}

export async function initializeStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  const persistedStatuses = await loadStatusesFromFile();
  statusStore.statuses.clear();

  let recoveredRunningStatus = false;

  for (const [kanriNo, status] of Object.entries(persistedStatuses)) {
    const normalizedKanriNo = normalizeKanriNo(kanriNo);
    if (!normalizedKanriNo) continue;

    if (isRunningStatus(status.status)) {
      statusStore.statuses.set(
        normalizedKanriNo,
        createScheduledStatus(normalizedKanriNo),
      );
      recoveredRunningStatus = true;
      continue;
    }

    statusStore.statuses.set(normalizedKanriNo, {
      ...status,
      kanriNo: normalizedKanriNo,
    });
  }

  if (recoveredRunningStatus) persistStatusesDebounced(statusStore.statuses);

  return Object.fromEntries(statusStore.statuses);
}

export function resetAllStatusesToScheduled(): Record<
  string,
  OperationStatusState
> {
  propagator.clearQueue();

  for (const kanriNo of statusStore.statuses.keys()) {
    applyStatus({
      kanriNo,
      status: JOB_STATUS.SCHEDULED,
      comment: "予定時刻待ち",
    });
  }

  persistStatusesImmediately(statusStore.statuses);
  return Object.fromEntries(statusStore.statuses);
}

export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...statusStore.targets.keys()];

  propagator.clearQueue();
  statusStore.statuses.clear();
  persistStatusesImmediately(statusStore.statuses);

  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

export function persistStatuses(): void {
  persistStatusesImmediately(statusStore.statuses);
}

export function clearStatuses(): void {
  statusStore.clear();
  propagator.clearAll();
}

/**
 * アクティブフラグ(1C/2C/3C)が変更された際に関連タスクのみを再計算する
 */
export function refreshDependencyStatuses(): void {
  propagator.clearQueue();
  propagator.enqueueCenterFlagDependents(statusStore.targets);
  propagator.processPropagation(recalculateTargetStatus);
}

export function refreshScheduledStatuses(): void {
  propagator.clearQueue();

  const targetKanriNo = "E23";
  const targetStatus = statusStore.statuses.get(targetKanriNo);
  const target = statusStore.targets.get(targetKanriNo);

  if (targetStatus) {
    console.log("[Status][E23] refreshScheduledStatuses", {
      status: targetStatus.status,
      comment: targetStatus.comment,
      scheduledTime: target?.scheduledTime,
      dependsOn: target?.dependsOn,
    });
  }

  for (const [kanriNo, status] of statusStore.statuses) {
    if (
      status.status === JOB_STATUS.SCHEDULED ||
      status.status === JOB_STATUS.WAITING
    ) {
      propagator.enqueueAllRecalculableTargets(
        statusStore.statuses,
        statusStore.targets,
      );
      propagator.enqueueDependents(kanriNo);
      break;
    }
  }

  propagator.processPropagation(recalculateTargetStatus);
}
