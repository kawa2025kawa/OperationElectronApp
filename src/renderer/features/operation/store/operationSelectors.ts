// src/renderer/features/operation/store/operationSelectors.ts

import type { AppState } from "@shared/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { STATUS_LABEL } from "@shared/types/uiType";

export const selectCurrentMode = (state: AppState) => state.currentMode;

const getEntitiesByIds = (
  ids: string[],
  entities: Record<string, OperationItem>,
): OperationItem[] =>
  ids
    .map((id) => entities[id])
    .filter((item): item is OperationItem => Boolean(item));

const containsTerm = (obj: unknown, term: string): boolean => {
  if (obj == null) return false;
  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return String(obj).toLowerCase().includes(term);
  }
  if (Array.isArray(obj)) {
    return obj.some((item) => containsTerm(item, term));
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj as Record<string, unknown>).some((val) =>
      containsTerm(val, term),
    );
  }
  return false;
};

const filterTableItems = (
  items: OperationItem[],
  term: string,
  _isIrregular = false,
): OperationItem[] => {
  if (!term) return items;
  return items.filter((item) => {
    const statusText = item.status ? STATUS_LABEL[item.status] : undefined;
    return (
      containsTerm(item, term) ||
      (statusText ? statusText.toLowerCase().includes(term) : false)
    );
  });
};

export const selectOperationTableData = (state: AppState): OperationItem[] =>
  filterTableItems(
    getEntitiesByIds(state.operationIds, state.operationEntities),
    state.searchTerm.trim().toLowerCase(),
    false,
  );

export const selectIrregularTableData = (state: AppState): OperationItem[] =>
  filterTableItems(
    getEntitiesByIds(state.irregularIds, state.irregularEntities),
    state.searchTerm.trim().toLowerCase(),
    true,
  );

const selectTodayTableData = (state: AppState): OperationItem[] =>
  filterTableItems(
    getEntitiesByIds(state.todayIds, state.irregularEntities),
    state.searchTerm.trim().toLowerCase(),
    true,
  );

export const selectFilteredOperationIds = (state: AppState): string[] =>
  selectOperationTableData(state).map((item) => item.kanriNo);

export const selectFilteredIrregularIds = (state: AppState): string[] =>
  selectIrregularTableData(state).map((item) => item.kanriNo);

export const selectFilteredTodayIds = (state: AppState): string[] =>
  selectTodayTableData(state).map((item) => item.kanriNo);

export const selectActiveSelectedItem = (
  state: AppState,
): OperationItem | undefined => {
  const mode = state.currentMode;
  const id = state.selectedIds[mode];
  if (!id) return undefined;
  return mode === "operation"
    ? state.operationEntities[id]
    : state.irregularEntities[id];
};

export const selectActiveItemStatusFlags = (state: AppState) => {
  const item = selectActiveSelectedItem(state);
  const status = item?.status ?? JOB_STATUS.SCHEDULED;

  return {
    item,
    status,
    isExecuting:
      status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING,
    isError: status === JOB_STATUS.ERROR,
    isSuccess: status === JOB_STATUS.SUCCESS,
    isWaiting: status === JOB_STATUS.WAITING,
    isReady: status === JOB_STATUS.READY,
  };
};
