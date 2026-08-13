import type { AppState } from "@shared/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { STATUS_LABEL } from "@shared/types/uiType";

export const selectCurrentMode = (state: AppState) => state.currentMode;

export const selectSelectedOperationId = (state: AppState) =>
  state.selectedIds.operation;

export const selectSelectedIrregularId = (state: AppState) =>
  state.selectedIds.irregular;

export const selectSelectedTodayId = (state: AppState) =>
  state.selectedIds.today;

const mapEntitiesByIds = (
  ids: string[],
  entities: Record<string, OperationItem>,
): OperationItem[] => {
  return ids
    .map((id) => entities[id])
    .filter((item): item is OperationItem => Boolean(item));
};

const normalizeSearchTerm = (value: string): string => {
  return value.trim().toLowerCase();
};

const includesValue = (
  value: string | null | undefined,
  searchTerm: string,
): boolean => {
  return value?.toLowerCase().includes(searchTerm) ?? false;
};

const matchesAny = (
  values: Array<string | null | undefined>,
  searchTerm: string,
): boolean => {
  return values.some((value) => includesValue(value, searchTerm));
};

const matchesOperation = (item: OperationItem, searchTerm: string): boolean => {
  return matchesAny(
    [
      item.workName,
      item.jobId,
      item.kanriNo,
      item.status,
      item.status ? STATUS_LABEL[item.status] : undefined,
    ],
    searchTerm,
  );
};

const matchesIrregular = (item: OperationItem, searchTerm: string): boolean => {
  return matchesAny(
    [item.workName, item.kanriNo, item.cycle1, item.cycle2],
    searchTerm,
  );
};

const filterItems = (
  items: OperationItem[],
  searchTerm: string,
  matcher: (item: OperationItem, searchTerm: string) => boolean,
): OperationItem[] => {
  if (!searchTerm) {
    return items;
  }

  return items.filter((item) => matcher(item, searchTerm));
};

export const selectOperationTableData = (state: AppState): OperationItem[] => {
  return filterItems(
    mapEntitiesByIds(state.operationIds, state.operationEntities),
    normalizeSearchTerm(state.searchTerm),
    matchesOperation,
  );
};

export const selectIrregularTableData = (state: AppState): OperationItem[] => {
  return filterItems(
    mapEntitiesByIds(state.irregularIds, state.irregularEntities),
    normalizeSearchTerm(state.searchTerm),
    matchesIrregular,
  );
};

export const selectTodayTableData = (state: AppState): OperationItem[] => {
  return filterItems(
    mapEntitiesByIds(state.todayIds, state.irregularEntities),
    normalizeSearchTerm(state.searchTerm),
    matchesIrregular,
  );
};

export const selectFilteredOperationIds = (state: AppState): string[] => {
  return selectOperationTableData(state).map((item) => item.kanriNo);
};

export const selectFilteredIrregularIds = (state: AppState): string[] => {
  return selectIrregularTableData(state).map((item) => item.kanriNo);
};

export const selectFilteredTodayIds = (state: AppState): string[] => {
  return selectTodayTableData(state).map((item) => item.kanriNo);
};

export const selectActiveSelectedItem = (
  state: AppState,
): OperationItem | undefined => {
  switch (state.currentMode) {
    case "operation": {
      const id = state.selectedIds.operation;

      return id ? state.operationEntities[id] : undefined;
    }

    case "irregular": {
      const id = state.selectedIds.irregular;

      return id ? state.irregularEntities[id] : undefined;
    }

    case "today": {
      const id = state.selectedIds.today;

      return id ? state.irregularEntities[id] : undefined;
    }

    default:
      return undefined;
  }
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
