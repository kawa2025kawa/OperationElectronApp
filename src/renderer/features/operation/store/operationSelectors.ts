// src/renderer/features/operation/store/operationSelectors.ts

import type { AppState } from "@renderer/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operation";
import { STATUS_LABEL } from "@shared/types/ui";

// ============================================================================
// Common Selectors
// ============================================================================

export const selectCurrentMode = (state: AppState) => state.currentMode;

// ============================================================================
// Entity Selectors
// ============================================================================

function getEntitiesByIds(
  ids: string[],
  entities: Record<string, OperationItem>,
): OperationItem[] {
  return ids
    .map((id) => entities[id])
    .filter((item): item is OperationItem => item !== undefined);
}

// ============================================================================
// Search
// ============================================================================

function containsSearchTerm(value: unknown, term: string): boolean {
  if (value == null) {
    return false;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).toLowerCase().includes(term);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsSearchTerm(item, term));
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      containsSearchTerm(item, term),
    );
  }

  return false;
}

function filterTableItems(
  items: OperationItem[],
  searchTerm: string,
): OperationItem[] {
  if (!searchTerm) {
    return items;
  }

  return items.filter((item) => {
    if (containsSearchTerm(item, searchTerm)) {
      return true;
    }

    if (!item.status) {
      return false;
    }

    const label = STATUS_LABEL[item.status];

    return label?.toLowerCase().includes(searchTerm) ?? false;
  });
}

function getNormalizedSearchTerm(state: AppState): string {
  return state.searchTerm.trim().toLowerCase();
}

// ============================================================================
// Table Selectors
// ============================================================================

export const selectOperationTableData = (state: AppState): OperationItem[] => {
  return filterTableItems(
    getEntitiesByIds(state.operationIds, state.operationEntities),
    getNormalizedSearchTerm(state),
  );
};

export const selectIrregularTableData = (state: AppState): OperationItem[] => {
  return filterTableItems(
    getEntitiesByIds(state.irregularIds, state.irregularEntities),
    getNormalizedSearchTerm(state),
  );
};

export const selectTodayTableData = (state: AppState): OperationItem[] => {
  return filterTableItems(
    getEntitiesByIds(state.todayIds, state.irregularEntities),
    getNormalizedSearchTerm(state),
  );
};

// ============================================================================
// Filtered IDs
// ============================================================================

export const selectFilteredOperationIds = (state: AppState): string[] =>
  selectOperationTableData(state).map((item) => item.kanriNo);

export const selectFilteredIrregularIds = (state: AppState): string[] =>
  selectIrregularTableData(state).map((item) => item.kanriNo);

export const selectFilteredTodayIds = (state: AppState): string[] =>
  selectTodayTableData(state).map((item) => item.kanriNo);

// ============================================================================
// Selected Item
// ============================================================================

export const selectActiveSelectedItem = (
  state: AppState,
): OperationItem | undefined => {
  const selectedId = state.selectedIds[state.currentMode];

  if (!selectedId) {
    return undefined;
  }

  if (state.currentMode === "operation") {
    return state.operationEntities[selectedId];
  }

  return state.irregularEntities[selectedId];
};

// ============================================================================
// Selected Item Status
// ============================================================================

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
