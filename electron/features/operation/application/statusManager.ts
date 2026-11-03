// electron/features/operation/application/statusManager.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import {
  clearSpreadsheetMasterDataCache,
  getSpreadsheetMasterData,
} from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  createScheduledStatus,
  hasStatusChanged,
  isProtectedStatus,
  isRunningStatus,
  mergeStatus,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import { calculateOperationStatus } from "@electron/features/operation/domain/statusCalculator";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";
import {
  loadActiveFlags,
  persistActiveFlags,
} from "@electron/features/operation/infrastructure/storage/activeFlagsStorage";
import {
  DEFAULT_ACTIVE_FLAGS,
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusNotification,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import type {
  DependencyMasters,
  DependencyStatuses,
} from "@electron/features/operation/domain/dependencyUtils";
import { DependencyPropagator } from "./dependencyPropagator";
import type {
  ApplyStatusOptions,
  ReadyStatusListener,
  StatusTarget,
} from "./statusTypes";

export type { ApplyStatusOptions, ReadyStatusListener, StatusTarget };

// ============================================================
// インメモリ状態
// ============================================================

export const statusState = {
  targets: new Map<string, StatusTarget>(),
  statuses: new Map<string, OperationStatusState>(),
  activeFlags: { ...DEFAULT_ACTIVE_FLAGS } as ActiveFlags,
  dependencyMasters: {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  } as DependencyMasters,
  propagator: new DependencyPropagator(),
};

// ============================================================
// 通知管理 (Notifier)
// ============================================================

const readyStatusListeners = new Set<ReadyStatusListener>();

function broadcast(notification: OperationStatusNotification): void {
  const windows = BrowserWindow.getAllWindows();

  for (const window of windows) {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      try {
        window.webContents.send(
          IPC_CHANNELS.OPERATION.STATUS_UPDATED,
          notification,
        );
      } catch (error) {
        console.error("[StatusNotifier] 送信エラー:", error);
      }
    }
  }
}

export function notifyStatusUpdated(status: OperationStatusState): void {
  broadcast({
    type: "updated",
    update: status,
  });
}

export function notifyStatusCleared(kanriNo: string): void {
  broadcast({
    type: "cleared",
    kanriNo,
  });
}

export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}

// ============================================================
// ステータス更新 & 依存伝播
// ============================================================

function processPropagation(flags = statusState.activeFlags): void {
  statusState.propagator.processPropagation((kanriNo) => {
    recalculateTargetStatus(kanriNo, flags, false);
  });
}

function applyStatus(
  update: OperationStatusState,
  {
    propagate = true,
    flags = statusState.activeFlags,
  }: ApplyStatusOptions = {},
): boolean {
  const kanriNo = normalizeKanriNo(update.kanriNo);
  if (!kanriNo) return false;

  const previous = statusState.statuses.get(kanriNo);
  const next = mergeStatus(previous, {
    ...update,
    kanriNo,
  });

  if (!hasStatusChanged(previous, next)) {
    return true;
  }

  statusState.statuses.set(kanriNo, next);
  persistStatusesDebounced(statusState.statuses);
  notifyStatusUpdated(next);

  if (
    next.status === JOB_STATUS.READY &&
    previous?.status !== JOB_STATUS.READY
  ) {
    const target = statusState.targets.get(kanriNo);
    if (target) {
      notifyReady(target);
    }
  }

  if (propagate) {
    statusState.propagator.enqueueDependents(kanriNo);
    processPropagation(flags);
  }

  return true;
}

export function recalculateTargetStatus(
  kanriNo: string,
  flags: ActiveFlags = statusState.activeFlags,
  propagate = true,
): void {
  const target = statusState.targets.get(kanriNo);
  if (!target) return;

  const current = statusState.statuses.get(kanriNo);
  if (isProtectedStatus(current?.status)) return;

  applyStatus(
    calculateOperationStatus(
      target,
      statusState.dependencyMasters,
      { statuses: statusState.statuses },
      flags,
    ),
    { propagate, flags },
  );
}

// 全ターゲットのステータスを一括で再計算・判定する（依存関係順序で伝播）
export function recalculateAllStatuses(
  flags: ActiveFlags = statusState.activeFlags,
): void {
  statusState.propagator.enqueueAllRecalculableTargets(
    statusState.statuses,
    statusState.targets,
  );

  processPropagation(flags);
}

export function updateStatus(
  inputOrKanriNo: OperationStatusState | string,
  statusOrOptions?: JobStatus | ApplyStatusOptions,
  options?: ApplyStatusOptions & { comment?: string },
): boolean {
  if (typeof inputOrKanriNo === "string") {
    const kanriNo = inputOrKanriNo;
    const status = statusOrOptions as JobStatus;
    return applyStatus(
      {
        kanriNo,
        status,
        comment: options?.comment,
      },
      options,
    );
  }

  const update = inputOrKanriNo;
  const opts = statusOrOptions as ApplyStatusOptions | undefined;
  return applyStatus(update, opts);
}

export function updateManualStatus(
  kanriNo: string,
  status: JobStatus,
  comment = "",
): boolean {
  const result = updateStatus(kanriNo, status, {
    comment,
    propagate: true,
  });

  if (result) {
    persistStatusesImmediately(statusState.statuses);
  }

  return result;
}

// ============================================================
// センターフラグ & ゲッター
// ============================================================

export function initializeActiveFlags(): void {
  statusState.activeFlags = loadActiveFlags();
}

export function getActiveFlags(): ActiveFlags {
  return { ...statusState.activeFlags };
}

export function updateOperationActiveFlags(flags: Partial<ActiveFlags>): void {
  const nextFlags: ActiveFlags = {
    ...statusState.activeFlags,
    ...flags,
  };

  persistActiveFlags(nextFlags);
  statusState.activeFlags = nextFlags;
  recalculateAllStatuses(nextFlags);
}

export function getDependencyMasters(): DependencyMasters {
  return statusState.dependencyMasters;
}

export function getDependencyStatuses(): DependencyStatuses {
  return {
    statuses: statusState.statuses,
  };
}

export function getTargets(): Map<string, StatusTarget> {
  return new Map(statusState.targets);
}

export function getStatuses(): Map<string, OperationStatusState> {
  return new Map(statusState.statuses);
}

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statusState.statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return statusState.targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...statusState.targets.values()];
}

// ============================================================
// ライフサイクル管理
// ============================================================

function createOperationTargetList(
  masterData: SpreadsheetMasterData,
): StatusTarget[] {
  return [
    ...masterData.operations.map((target) => ({
      ...target,
      targetType: "operation" as const,
    })),
    ...masterData.todayIrregulars.map((target) => ({
      ...target,
      targetType: "today" as const,
    })),
  ];
}

export async function resetAllStatusesAndTargets(): Promise<void> {
  await deleteStatusFile();

  statusState.propagator.clearAll();
  statusState.targets.clear();
  statusState.statuses.clear();
  statusState.dependencyMasters = {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  };
}

export function registerTargets(
  targetList: StatusTarget[],
  masterData: SpreadsheetMasterData,
): void {
  const nextTargets = new Map<string, StatusTarget>();

  for (const target of targetList) {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) continue;

    nextTargets.set(kanriNo, {
      ...target,
      kanriNo,
    });
  }

  const nextDependencyMasters = {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  };

  statusState.propagator.rebuildDependencyIndex(
    nextTargets.values(),
    nextDependencyMasters,
  );

  for (const kanriNo of statusState.targets.keys()) {
    if (!nextTargets.has(kanriNo)) {
      statusState.statuses.delete(kanriNo);
    }
  }

  statusState.targets.clear();

  for (const [kanriNo, target] of nextTargets) {
    statusState.targets.set(kanriNo, target);

    if (!statusState.statuses.has(kanriNo)) {
      statusState.statuses.set(kanriNo, createScheduledStatus(kanriNo));
    }
  }

  statusState.dependencyMasters = nextDependencyMasters;

  recalculateAllStatuses(statusState.activeFlags);
  persistStatusesDebounced(statusState.statuses);
}

export async function initializeStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  const persistedStatuses = await loadStatusesFromFile();
  statusState.statuses.clear();

  let recoveredRunningStatus = false;

  for (const [kanriNo, status] of Object.entries(persistedStatuses)) {
    const normalizedKanriNo = normalizeKanriNo(kanriNo);
    if (!normalizedKanriNo) continue;

    if (isRunningStatus(status.status)) {
      statusState.statuses.set(
        normalizedKanriNo,
        createScheduledStatus(normalizedKanriNo),
      );
      recoveredRunningStatus = true;
      continue;
    }

    statusState.statuses.set(normalizedKanriNo, {
      ...status,
      kanriNo: normalizedKanriNo,
    });
  }

  if (recoveredRunningStatus) {
    persistStatusesDebounced(statusState.statuses);
  }

  return Object.fromEntries(statusState.statuses);
}

export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...statusState.targets.keys()];

  statusState.propagator.clearQueue();
  statusState.statuses.clear();

  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

export function saveStatusesImmediately(): void {
  persistStatusesImmediately(statusState.statuses);
}

export async function registerOperationTargets(): Promise<void> {
  const masterData = await getSpreadsheetMasterData();
  const targetList = createOperationTargetList(masterData);

  registerTargets(targetList, masterData);
}

export async function resetOperationStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  await clearSpreadsheetMasterDataCache();

  const masterData = await getSpreadsheetMasterData();
  const targetList = createOperationTargetList(masterData);

  const validationPropagator = new DependencyPropagator();
  validationPropagator.rebuildDependencyIndex(targetList, {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  });

  await resetAllStatusesAndTargets();
  registerTargets(targetList, masterData);
  saveStatusesImmediately();

  return Object.fromEntries(statusState.statuses);
}
