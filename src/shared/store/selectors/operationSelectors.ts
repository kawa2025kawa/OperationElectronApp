// src/shared/store/selectors/operationSelectors.ts

import type { AppState } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import { JOB_STATUS } from "@shared/types/operationType";
import { STATUS_LABEL } from "@shared/types/uiType";

/* =====================================================
 * 1. Base Selectors
 * ===================================================== */
export const selectCurrentMode = (state: AppState) => state.currentMode;
export const selectSearchTerm = (state: AppState) => state.searchTerm;
export const selectSummary = (state: AppState) => state.summary;

export const selectSelectedOperationId = (state: AppState) =>
  state.selectedOperationId;
export const selectSelectedIrregularId = (state: AppState) =>
  state.selectedIrregularId;

/* =====================================================
 * 2. Helper
 * ===================================================== */
const getMappedData = (
  ids: string[],
  entities: Record<string, OperationItem>,
) =>
  ids
    .map((id) => entities[id])
    .filter((item): item is OperationItem => Boolean(item));

/* =====================================================
 * 3. Table Data Selectors
 * ===================================================== */

// ■ Operation テーブル用
export const selectOperationTableData = (state: AppState): OperationItem[] => {
  const search = state.searchTerm.trim().toLowerCase();
  const data = getMappedData(state.operationIds, state.operationEntities);

  if (!search) return data;
  return data.filter(
    (item) =>
      item.workName?.toLowerCase().includes(search) ||
      item.jobId?.toLowerCase().includes(search) ||
      item.kanriNo?.toLowerCase().includes(search) ||
      (item.status ?? "").toLowerCase().includes(search) ||
      (item.status ? (STATUS_LABEL[item.status] ?? "") : "")
        .toLowerCase()
        .includes(search),
  );
};

// ■ Irregular テーブル用（全件）
export const selectIrregularTableData = (state: AppState): OperationItem[] => {
  const search = state.searchTerm.trim().toLowerCase();
  const data = getMappedData(state.irregularIds, state.irregularEntities);

  if (!search) return data;
  return data.filter(
    (item) =>
      item.workName?.toLowerCase().includes(search) ||
      item.kanriNo?.toLowerCase().includes(search) ||
      item.cycle1?.toLowerCase().includes(search) ||
      item.cycle2?.toLowerCase().includes(search),
  );
};

// ■ TODAY テーブル用（Irregularデータの中から当日分のみ）
export const selectTodayTableData = (state: AppState): OperationItem[] => {
  const search = state.searchTerm.trim().toLowerCase();
  // irregularEntities から todayIds で抽出
  const data = getMappedData(state.todayIds, state.irregularEntities);

  if (!search) return data;
  return data.filter(
    (item) =>
      item.workName?.toLowerCase().includes(search) ||
      item.kanriNo?.toLowerCase().includes(search) ||
      item.cycle1?.toLowerCase().includes(search) ||
      item.cycle2?.toLowerCase().includes(search),
  );
};

export const selectFilteredOperationIds = (state: AppState) =>
  selectOperationTableData(state).map((i) => i.kanriNo);

export const selectFilteredIrregularIds = (state: AppState) =>
  selectIrregularTableData(state).map((i) => i.kanriNo);

export const selectFilteredTodayIds = (state: AppState) =>
  selectTodayTableData(state).map((i) => i.kanriNo);

/* =====================================================
 * 4. Active Item Selectors（選択行の判定）
 * ===================================================== */
export const selectActiveSelectedItem = (
  state: AppState,
): OperationItem | undefined => {
  // TODAY モード・Irregular モードともに irregularEntities から取得
  if (state.currentMode === "irregular" || state.currentMode === "today") {
    return state.selectedIrregularId
      ? state.irregularEntities[state.selectedIrregularId]
      : undefined;
  }
  const id = state.selectedOperationId;
  return id ? state.operationEntities[id] : undefined;
};

export const selectActiveItemStatusFlags = (state: AppState) => {
  const item = selectActiveSelectedItem(state);
  const status = item?.status ?? JOB_STATUS.SCHEDULED;

  return {
    item,
    status,
    isExecuting:
      status === JOB_STATUS.RUNNING || status === JOB_STATUS.scriptRunning,
    isError: status === JOB_STATUS.ERROR,
    isSuccess: status === JOB_STATUS.SUCCESS,
    isWaiting: status === JOB_STATUS.WAITING,
    isReady: status === JOB_STATUS.READY,
  };
};
