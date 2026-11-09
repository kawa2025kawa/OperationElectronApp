// electron/features/operation/application/statusLifecycleService.ts

import {
  clearSpreadsheetMasterDataCache,
  getSpreadsheetMasterData,
} from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import type { SpreadsheetMasterData } from "@electron/features/masterData/types/internalSpreadsheetMasterDataTypes";
import {
  createScheduledStatus,
  isRunningStatus,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type { DependencyMasters } from "@electron/features/operation/domain/dependencyUtils";
import { DependencyPropagator } from "./dependencyPropagator";
import { notifyStatusCleared } from "./statusNotifier";
import { statusState } from "./statusState";
import { recalculateAllStatuses } from "./statusUpdater";
import type { StatusTarget } from "./statusTypes";

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

async function resetAllStatusesAndTargets(): Promise<void> {
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

function registerTargets(
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

  const nextDependencyMasters: DependencyMasters = {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  };

  // 依存関係の検証が成功するまで既存状態を変更しない。
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

function saveStatusesImmediately(): void {
  void persistStatusesImmediately(statusState.statuses);
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

  // 既存ステータスを削除する前に依存関係を検証する。
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
