// electron/features/operation/application/statusLifecycleService.ts

import {
  clearSpreadsheetMasterDataCache,
  getSpreadsheetMasterData,
} from "@electron/features/masterData/application/spreadsheetMasterDataManager";
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
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import type { StatusTarget } from "./statusTypes";
import { DependencyPropagator } from "./dependencyPropagator";
import { notifyStatusCleared } from "./statusNotifier";
import { recalculateAllStatuses } from "./statusUpdater";
import { statusState } from "./statusState";

// マスターデータから運用ターゲット一覧を構築する。
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

// 全ターゲットおよびステータスを初期化し、保存ファイルを削除する。
export async function resetAllStatusesAndTargets(): Promise<void> {
  // ファイル削除に失敗した場合は、既存のインメモリ状態を維持する。
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

// マスターデータに基づきターゲットとステータスを同期し、依存関係を再構築する。
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

  // 状態を変更する前に依存グラフを検証・再構築する。
  // 自己依存・循環依存があれば例外となり、既存の登録状態は維持される。
  statusState.propagator.rebuildDependencyIndex(
    nextTargets.values(),
    nextDependencyMasters,
  );

  // マスターから除外された管理番号のステータスを削除する。
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

// 永続化ファイルからステータスを読み込んでインメモリを復元する。
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

// 全ステータスを削除し、レンダラーへクリア通知を送信する。
export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...statusState.targets.keys()];

  statusState.propagator.clearQueue();
  statusState.statuses.clear();

  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

// 現在のインメモリステータスを即時ファイル保存する。
export function saveStatusesImmediately(): void {
  persistStatusesImmediately(statusState.statuses);
}

// マスターから運用ターゲットを構築し、ステータス管理へ登録する。
export async function registerOperationTargets(): Promise<void> {
  const masterData = await getSpreadsheetMasterData();
  const targetList = createOperationTargetList(masterData);

  registerTargets(targetList, masterData);
}

// マスターキャッシュと運用状態をリセットし、マスターを再取得して状態を再構築する。
export async function resetOperationStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  await clearSpreadsheetMasterDataCache();

  // 既存状態を変更する前にマスターデータを取得する。
  const masterData = await getSpreadsheetMasterData();
  const targetList = createOperationTargetList(masterData);

  // 一時インスタンスでDAG検証する。
  // 検証失敗時も既存のステータス・依存グラフ・保存ファイルは維持される。
  const validationPropagator = new DependencyPropagator();

  validationPropagator.rebuildDependencyIndex(targetList, {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  });

  // 検証成功後にのみ既存状態をリセットして再登録する。
  await resetAllStatusesAndTargets();
  registerTargets(targetList, masterData);
  saveStatusesImmediately();

  return Object.fromEntries(statusState.statuses);
}
