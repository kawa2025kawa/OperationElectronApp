//src\renderer\features\operation\store\operationSelectors.ts

import type { AppState } from "@shared/store";
import { STATUS_LABEL } from "@shared/types/uiType";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";

export const selectCurrentMode = (state: AppState) => state.currentMode;

export const selectSelectedOperationId = (state: AppState) =>
  state.selectedIds.operation;

export const selectSelectedIrregularId = (state: AppState) =>
  state.selectedIds.irregular;

export const selectSelectedTodayId = (state: AppState) =>
  state.selectedIds.today;

const getEntitiesByIds = (
  ids: string[],
  entities: Record<string, OperationItem>,
): OperationItem[] =>
  ids
    .map((id) => entities[id])
    .filter((item): item is OperationItem => Boolean(item));

const matchesSearch = (
  targets: Array<string | null | undefined>,
  term: string,
): boolean => !term || targets.some((val) => val?.toLowerCase().includes(term));

const filterOperations = (items: OperationItem[], term: string) =>
  items.filter((item) =>
    matchesSearch(
      [
        item.workName,
        "jobId" in item ? item.jobId : null,
        item.kanriNo,
        item.status,
        item.status ? STATUS_LABEL[item.status] : undefined,
      ],
      term,
    ),
  );

const filterIrregulars = (items: OperationItem[], term: string) =>
  items.filter((item) =>
    matchesSearch(
      [
        item.workName,
        item.kanriNo,
        "cycle1" in item ? item.cycle1 : null,
        "cycle2" in item ? item.cycle2 : null,
      ],
      term,
    ),
  );

export const selectOperationTableData = (state: AppState): OperationItem[] =>
  filterOperations(
    getEntitiesByIds(state.operationIds, state.operationEntities),
    state.searchTerm.trim().toLowerCase(),
  );

export const selectIrregularTableData = (state: AppState): OperationItem[] =>
  filterIrregulars(
    getEntitiesByIds(state.irregularIds, state.irregularEntities),
    state.searchTerm.trim().toLowerCase(),
  );

export const selectTodayTableData = (state: AppState): OperationItem[] =>
  filterIrregulars(
    getEntitiesByIds(state.todayIds, state.irregularEntities),
    state.searchTerm.trim().toLowerCase(),
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
