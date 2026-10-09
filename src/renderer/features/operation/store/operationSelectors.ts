// src/renderer/features/operation/store/operationSelectors.ts

import type { AppState } from "@renderer/store";

import {
  selectIrregularMasters,
  selectOperationMasters,
  selectTodayIrregularMasters,
} from "@renderer/features/spreadSheet/store/spreadsheetSelectors";

import {
  JOB_STATUS,
  JOB_STATUS_LABEL,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Types
 * ========================= */

type OperationMasterRow = OperationMaster & OperationStatusState;
type IrregularMasterRow = IrregularMaster & OperationStatusState;
type TodayIrregularMasterRow = TodayIrregularMaster & OperationStatusState;

export type OperationTableRow =
  | OperationMasterRow
  | IrregularMasterRow
  | TodayIrregularMasterRow;

interface ActiveItemStatusFlags {
  item: OperationTableRow | undefined;
  status: JobStatus;
  isExecuting: boolean;
  isError: boolean;
  isSuccess: boolean;
  isWaiting: boolean;
  isReady: boolean;
}

type StatusMap = Record<string, OperationStatusState>;

/* =========================
 * Basic Selectors
 * ========================= */

export const selectCurrentMode = (state: AppState) => state.currentMode;

/* =========================
 * Status Lookup
 * ========================= */

const getStatus = (state: AppState, kanriNo: string): OperationStatusState => {
  if (state.todayIds.includes(kanriNo)) {
    return state.todayStatuses[kanriNo] ?? {};
  }

  if (state.irregularIds.includes(kanriNo)) {
    return state.irregularStatuses[kanriNo] ?? {};
  }

  return state.operationStatuses[kanriNo] ?? {};
};

/* =========================
 * Row Helper
 * ========================= */

const createRow = <
  T extends OperationMaster | IrregularMaster | TodayIrregularMaster,
>(
  state: AppState,
  master: T,
): T & OperationStatusState => {
  const kanriNo = String(master.kanriNo).trim();

  return {
    ...master,
    ...getStatus(state, kanriNo),
  };
};

/* =========================
 * Search Filtering
 * ========================= */

const containsSearchTerm = (value: unknown, term: string): boolean => {
  if (value == null) {
    return false;
  }

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return String(value).toLowerCase().includes(term);

    case "object":
      if (Array.isArray(value)) {
        return value.some((item) => containsSearchTerm(item, term));
      }

      return Object.values(value as Record<string, unknown>).some((item) =>
        containsSearchTerm(item, term),
      );

    default:
      return false;
  }
};

const getSearchTerm = (state: AppState): string => {
  return state.searchTerm.trim().toLowerCase();
};

const matchesSearchTerm = (
  item: OperationTableRow,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  if (containsSearchTerm(item, searchTerm)) {
    return true;
  }

  if (!item.status) {
    return false;
  }

  return (
    JOB_STATUS_LABEL[item.status]?.toLowerCase().includes(searchTerm) ?? false
  );
};

const filterTableItems = <T extends OperationTableRow>(
  items: T[],
  searchTerm: string,
): T[] => {
  if (!searchTerm) {
    return items;
  }

  return items.filter((item) => matchesSearchTerm(item, searchTerm));
};

/* =========================
 * Table Selectors
 * ========================= */

type MasterItem = OperationMaster | IrregularMaster | TodayIrregularMaster;

function createTableSelector<
  TMaster extends MasterItem,
  TRow extends TMaster & OperationStatusState,
>(getMasters: (state: AppState) => TMaster[]): (state: AppState) => TRow[] {
  let previousMasters: TMaster[] | null = null;
  let previousOperationStatuses: StatusMap | null = null;
  let previousIrregularStatuses: StatusMap | null = null;
  let previousTodayStatuses: StatusMap | null = null;
  let previousSearchTerm = "";

  let cachedRows: TRow[] = [];

  return (state: AppState): TRow[] => {
    const masters = getMasters(state);
    const operationStatuses = state.operationStatuses;
    const irregularStatuses = state.irregularStatuses;
    const todayStatuses = state.todayStatuses;
    const searchTerm = getSearchTerm(state);

    const isCacheValid =
      previousMasters === masters &&
      previousOperationStatuses === operationStatuses &&
      previousIrregularStatuses === irregularStatuses &&
      previousTodayStatuses === todayStatuses &&
      previousSearchTerm === searchTerm;

    if (isCacheValid) {
      return cachedRows;
    }

    const rows = masters.map((master) => createRow(state, master) as TRow);

    cachedRows = filterTableItems(rows, searchTerm);

    previousMasters = masters;
    previousOperationStatuses = operationStatuses;
    previousIrregularStatuses = irregularStatuses;
    previousTodayStatuses = todayStatuses;
    previousSearchTerm = searchTerm;

    return cachedRows;
  };
}

export const selectOperationTableData = createTableSelector<
  OperationMaster,
  OperationMasterRow
>(selectOperationMasters);

export const selectIrregularTableData = createTableSelector<
  IrregularMaster,
  IrregularMasterRow
>(selectIrregularMasters);

export const selectTodayTableData = createTableSelector<
  TodayIrregularMaster,
  TodayIrregularMasterRow
>(selectTodayIrregularMasters);

/* =========================
 * Filtered IDs Selectors
 * ========================= */

function createIdSelector<T extends OperationTableRow>(
  selectRows: (state: AppState) => T[],
): (state: AppState) => string[] {
  let previousRows: T[] | null = null;
  let cachedIds: string[] = [];

  return (state: AppState): string[] => {
    const rows = selectRows(state);

    if (previousRows === rows) {
      return cachedIds;
    }

    cachedIds = rows.map((item) => item.kanriNo);
    previousRows = rows;

    return cachedIds;
  };
}

export const selectFilteredOperationIds = createIdSelector(
  selectOperationTableData,
);

export const selectFilteredIrregularIds = createIdSelector(
  selectIrregularTableData,
);

export const selectFilteredTodayIds = createIdSelector(selectTodayTableData);

/* =========================
 * Active Item Selection & Status Flags
 * ========================= */

const getMastersByMode = (state: AppState): MasterItem[] => {
  switch (state.currentMode) {
    case "operation":
      return selectOperationMasters(state);

    case "irregular":
      return selectIrregularMasters(state);

    case "today":
      return selectTodayIrregularMasters(state);
  }
};

function createActiveItemStatusFlagsSelector() {
  let previousMode: string | null = null;
  let previousSelectedId: string | null = null;
  let previousMasters: MasterItem[] | null = null;
  let previousMasterItem: MasterItem | null | undefined = null;
  let previousItemStatus: OperationStatusState | null = null;

  let cachedFlags: ActiveItemStatusFlags | null = null;

  return (state: AppState): ActiveItemStatusFlags => {
    const currentMode = state.currentMode;
    const selectedId = String(state.selectedIds[currentMode] ?? "").trim();
    const masters = getMastersByMode(state);

    const masterItem = selectedId
      ? masters.find((item) => String(item.kanriNo).trim() === selectedId)
      : undefined;

    const kanriNo = masterItem ? String(masterItem.kanriNo).trim() : "";
    const itemStatus = kanriNo ? getStatus(state, kanriNo) : null;

    const isCacheValid =
      previousMode === currentMode &&
      previousSelectedId === selectedId &&
      previousMasters === masters &&
      previousMasterItem === masterItem &&
      previousItemStatus === itemStatus;

    if (isCacheValid && cachedFlags) {
      return cachedFlags;
    }

    const item: OperationTableRow | undefined = masterItem
      ? { ...masterItem, ...(itemStatus ?? {}) }
      : undefined;

    const status = item?.status ?? JOB_STATUS.SCHEDULED;
    const isExecuting =
      status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;

    cachedFlags = {
      item,
      status,
      isExecuting,
      isError: status === JOB_STATUS.ERROR,
      isSuccess: status === JOB_STATUS.SUCCESS,
      isWaiting: status === JOB_STATUS.WAITING,
      isReady: status === JOB_STATUS.READY,
    };

    previousMode = currentMode;
    previousSelectedId = selectedId;
    previousMasters = masters;
    previousMasterItem = masterItem;
    previousItemStatus = itemStatus;

    return cachedFlags;
  };
}

export const selectActiveItemStatusFlags =
  createActiveItemStatusFlagsSelector();

export const selectActiveSelectedItem = (
  state: AppState,
): OperationTableRow | undefined => {
  return selectActiveItemStatusFlags(state).item;
};
