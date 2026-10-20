// electron/features/operation/application/statusManager.ts

import {
  clearJsonMasterDataCache,
  getJsonMasterData,
} from "@electron/features/masterData/application/jsonMasterDataManager";
import { clearSpreadsheetMasterDataCache } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  getActiveFlags,
  setActiveFlags,
} from "@electron/features/operation/application/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { calculateOperationStatus } from "@electron/features/operation/domain/statusCalculator";
import {
  createScheduledStatus,
  hasStatusChanged,
  isProtectedStatus,
  isRunningStatus,
  mergeStatus,
} from "@electron/features/operation/domain/statusRules";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";
import type { DependencyMasters } from "@shared/utils/dependency/dependencyUtils";
import { DependencyPropagator } from "./dependencyPropagator";
import {
  notifyReady,
  notifyStatusCleared,
  notifyStatusUpdated,
  onReadyStatus,
  type StatusTarget,
} from "./statusNotifier";

export type { StatusTarget };
export { onReadyStatus };

type StatusMap = Record<string, OperationStatusState>;

interface ApplyStatusOptions {
  propagate?: boolean;
}

// -----------------------------------------------------------------------------
// インメモリ状態管理
// -----------------------------------------------------------------------------

const targets = new Map<string, StatusTarget>();
const statuses = new Map<string, OperationStatusState>();
let dependencyMasters: DependencyMasters = {
  operationMasters: [],
  irregularMasters: [],
  todayIrregularMasters: [],
};

const propagator = new DependencyPropagator();

// 登録されている運用ターゲットのMapを取得する。
export function getTargets(): Map<string, StatusTarget> {
  return new Map(targets);
}

// 現在の全運用ステータスのMapのコピーを取得する。
export function getStatuses(): Map<string, OperationStatusState> {
  return new Map(statuses);
}

// 依存関係判定用のマスターデータ一覧を取得する。
export function getDependencyMasters(): DependencyMasters {
  return dependencyMasters;
}

// 前提条件判定用のステータスマップを取得する。
export function getDependencyStatuses(): { statuses: StatusMap } {
  return {
    statuses: Object.fromEntries(statuses),
  };
}

// 現在保持している全ステータスをオブジェクト形式で取得する。
export function getAllStatuses(): Record<string, OperationStatusState> {
  return Object.fromEntries(statuses);
}

// 指定管理Noのステータス情報を取得する。
export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statuses.get(normalizeKanriNo(kanriNo));
}

// 指定管理Noのターゲット情報を取得する。
export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return targets.get(normalizeKanriNo(kanriNo));
}

// 登録されている全ターゲットの配列を取得する。
export function getRegisteredTargets(): StatusTarget[] {
  return [...targets.values()];
}

// -----------------------------------------------------------------------------
// ステータス更新 & 依存伝播
// -----------------------------------------------------------------------------

// 指定管理Noのステータスを前提条件やセンターフラグに基づき再計算する。
export function recalculateTargetStatus(
  kanriNo: string,
  activeFlags: ActiveFlags = getActiveFlags(),
): void {
  const target = targets.get(kanriNo);
  if (!target) {
    return;
  }

  const current = statuses.get(kanriNo);
  if (isProtectedStatus(current?.status)) {
    return;
  }

  applyStatus(
    calculateOperationStatus(
      target,
      dependencyMasters,
      getDependencyStatuses(),
      activeFlags,
    ),
  );
}

// 全ターゲットのステータスを一括で再計算・判定する
export function recalculateAllStatuses(
  activeFlags: ActiveFlags = getActiveFlags(),
): void {
  for (const kanriNo of targets.keys()) {
    recalculateTargetStatus(kanriNo, activeFlags);
  }
}

// キューに入った依存ターゲットの再計算を順次処理する。
function processPropagation(activeFlags = getActiveFlags()): void {
  propagator.processPropagation((kanriNo) => {
    recalculateTargetStatus(kanriNo, activeFlags);
  });
}

// ステータス変更をインメモリ・ディスクに反映し、READY通知や依存伝播を行う。
function applyStatus(
  update: OperationStatusState,
  { propagate = true }: ApplyStatusOptions = {},
): boolean {
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

  if (propagate) {
    propagator.enqueueDependents(kanriNo);
    processPropagation();
  }

  return true;
}

// ステータス更新を適用する公開関数。
export function updateStatus(update: OperationStatusState): boolean {
  return applyStatus(update);
}

// 手動指定されたステータスとコメントを対象管理Noに反映する。
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

// 現在のインメモリステータスを即時ファイル保存する。
export function saveStatusesImmediately(): void {
  persistStatusesImmediately(statuses);
}

// 全ターゲットおよびステータスを初期化し、保存ファイルを削除する。
export async function resetAllStatusesAndTargets(): Promise<void> {
  propagator.clearAll();
  targets.clear();
  statuses.clear();
  dependencyMasters = {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  };
  await deleteStatusFile();
}

// マスターデータに基づきターゲットリストを登録し、初期依存関係を構築する。
export function registerTargets(
  targetList: StatusTarget[],
  masterData: JsonMasterData,
): void {
  dependencyMasters = {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  };

  for (const target of targetList) {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) {
      continue;
    }
    targets.set(kanriNo, target);

    if (!statuses.has(kanriNo)) {
      statuses.set(kanriNo, createScheduledStatus(kanriNo));
    }
  }

  propagator.rebuildDependencyIndex(targets.values());
  recalculateAllStatuses(getActiveFlags());
  persistStatusesDebounced(statuses);
}

// 永続化ファイルからステータスを読み込んでインメモリを復元する。
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

// 全ステータスを予定状態にリセットし再計算する。
export function resetAllStatusesToScheduled(): Record<
  string,
  OperationStatusState
> {
  propagator.clearQueue();

  for (const kanriNo of statuses.keys()) {
    applyStatus(
      {
        kanriNo,
        status: JOB_STATUS.SCHEDULED,
        comment: "",
      },
      { propagate: false },
    );
  }

  recalculateAllStatuses(getActiveFlags());
  persistStatusesImmediately(statuses);

  return Object.fromEntries(statuses);
}

// 全ステータスを削除し、レンダラーへクリア通知を送信する。
export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...targets.keys()];

  propagator.clearQueue();
  statuses.clear();
  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

// センターフラグに依存するジョブのステータス再計算をトリガーする。
export function refreshDependencyStatuses(): void {
  recalculateAllStatuses(getActiveFlags());
}

// -----------------------------------------------------------------------------
// コマンド操作（旧 operationCommandService から統合）
// -----------------------------------------------------------------------------

// Google Driveマスターから運用ターゲットを構築して登録する。
export async function registerOperationTargets(): Promise<void> {
  const masterData = await getJsonMasterData();

  const targetList: StatusTarget[] = [
    ...masterData.operations.map((target) => ({
      ...target,
      targetType: "operation" as const,
    })),
    ...masterData.todayIrregulars.map((target) => ({
      ...target,
      targetType: "today" as const,
    })),
  ];

  registerTargets(targetList, masterData);
}

// 全キャッシュとステータスを破棄し、マスター再取得および初期ステータス構築を実行する。
export async function resetOperationStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  await clearJsonMasterDataCache();
  await clearSpreadsheetMasterDataCache();
  await resetAllStatusesAndTargets();
  await registerOperationTargets();
  saveStatusesImmediately();

  return getAllStatuses();
}

// センターフラグを更新し、関連する依存ステータスの再計算をトリガーする。
export function updateOperationActiveFlags(flags: Partial<ActiveFlags>): void {
  setActiveFlags(flags);
  refreshDependencyStatuses();
}
