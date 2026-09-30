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

export interface ActiveItemStatusFlags {
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
 * Status
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
 * Row
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
 * Search
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
 * Table Selector
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
 * Filtered IDs
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
 * Selected Item
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

const findSelectedMaster = (
  state: AppState,
  selectedId: string,
): OperationTableRow | undefined => {
  const master = getMastersByMode(state).find(
    (item) => String(item.kanriNo).trim() === selectedId,
  );

  return master ? createRow(state, master) : undefined;
};

let previousActiveMode: AppState["currentMode"] | null = null;

let previousActiveSelectedId: string | null = null;

let previousActiveMasters: MasterItem[] | null = null;

let previousActiveOperationStatuses: StatusMap | null = null;

let previousActiveIrregularStatuses: StatusMap | null = null;

let previousActiveTodayStatuses: StatusMap | null = null;

let cachedActiveItem: OperationTableRow | undefined;

export const selectActiveSelectedItem = (
  state: AppState,
): OperationTableRow | undefined => {
  const selectedId = String(state.selectedIds[state.currentMode] ?? "").trim();

  if (!selectedId) {
    previousActiveMode = state.currentMode;
    previousActiveSelectedId = null;
    previousActiveMasters = null;
    previousActiveOperationStatuses = null;
    previousActiveIrregularStatuses = null;
    previousActiveTodayStatuses = null;
    cachedActiveItem = undefined;

    return undefined;
  }

  const masters = getMastersByMode(state);

  const operationStatuses = state.operationStatuses;

  const irregularStatuses = state.irregularStatuses;

  const todayStatuses = state.todayStatuses;

  const isCacheValid =
    previousActiveMode === state.currentMode &&
    previousActiveSelectedId === selectedId &&
    previousActiveMasters === masters &&
    previousActiveOperationStatuses === operationStatuses &&
    previousActiveIrregularStatuses === irregularStatuses &&
    previousActiveTodayStatuses === todayStatuses;

  if (isCacheValid) {
    return cachedActiveItem;
  }

  cachedActiveItem = findSelectedMaster(state, selectedId);

  previousActiveMode = state.currentMode;
  previousActiveSelectedId = selectedId;
  previousActiveMasters = masters;
  previousActiveOperationStatuses = operationStatuses;
  previousActiveIrregularStatuses = irregularStatuses;
  previousActiveTodayStatuses = todayStatuses;

  return cachedActiveItem;
};

/* =========================
 * Active Item Status Flags
 * ========================= */

let previousActiveFlagsItem: OperationTableRow | undefined;

let previousActiveFlagsStatus: JobStatus = JOB_STATUS.SCHEDULED;

let cachedActiveFlags: ActiveItemStatusFlags = {
  item: undefined,
  status: JOB_STATUS.SCHEDULED,
  isExecuting: false,
  isError: false,
  isSuccess: false,
  isWaiting: false,
  isReady: false,
};

export const selectActiveItemStatusFlags = (
  state: AppState,
): ActiveItemStatusFlags => {
  const item = selectActiveSelectedItem(state);
  const status = item?.status ?? JOB_STATUS.SCHEDULED;

  if (
    previousActiveFlagsItem === item &&
    previousActiveFlagsStatus === status
  ) {
    return cachedActiveFlags;
  }

  previousActiveFlagsItem = item;
  previousActiveFlagsStatus = status;

  const isExecuting =
    status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;

  cachedActiveFlags = {
    item,
    status,
    isExecuting,
    isError: status === JOB_STATUS.ERROR,
    isSuccess: status === JOB_STATUS.SUCCESS,
    isWaiting: status === JOB_STATUS.WAITING,
    isReady: status === JOB_STATUS.READY,
  };

  return cachedActiveFlags;
};
