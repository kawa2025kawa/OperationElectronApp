import {
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import {
  type OperationMaster,
  type TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import { isRunningStatus } from "@shared/utils/statusUtils";

type SummaryFilter = "total" | "progress" | JobStatus | string;

export type OperationSummaryRow = OperationMaster & OperationStatusState;
export type TodaySummaryRow = TodayIrregularMaster & OperationStatusState;

export interface SummaryFilterData {
  operationMasters: OperationMaster[];
  todayIrregularMasters: TodayIrregularMaster[];
  operationStatuses: Record<string, OperationStatusState>;
  todayStatuses: Record<string, OperationStatusState>;
}

const normalizeKanriNo = (kanriNo: string): string => {
  return String(kanriNo).trim();
};

const getOperationStatus = (
  operationStatuses: Record<string, OperationStatusState>,
  todayStatuses: Record<string, OperationStatusState>,
  kanriNo: string,
): OperationStatusState => {
  const key = normalizeKanriNo(kanriNo);

  return operationStatuses[key] ?? todayStatuses[key] ?? {};
};

const createOperationRows = (
  masters: OperationMaster[],
  operationStatuses: Record<string, OperationStatusState>,
  todayStatuses: Record<string, OperationStatusState>,
): OperationSummaryRow[] => {
  return masters.map((master) => ({
    ...master,
    ...getOperationStatus(operationStatuses, todayStatuses, master.kanriNo),
  }));
};

const createTodayRows = (
  masters: TodayIrregularMaster[],
  operationStatuses: Record<string, OperationStatusState>,
  todayStatuses: Record<string, OperationStatusState>,
): TodaySummaryRow[] => {
  return masters.map((master) => ({
    ...master,
    ...getOperationStatus(operationStatuses, todayStatuses, master.kanriNo),
  }));
};

const getActiveTargetEntities = (
  data: SummaryFilterData,
): Array<OperationSummaryRow | TodaySummaryRow> => {
  return [
    ...createOperationRows(
      data.operationMasters,
      data.operationStatuses,
      data.todayStatuses,
    ),
    ...createTodayRows(
      data.todayIrregularMasters,
      data.operationStatuses,
      data.todayStatuses,
    ),
  ];
};

export function filterSummaryItems(
  data: SummaryFilterData,
  label: string,
): Array<OperationSummaryRow | TodaySummaryRow> {
  const filter = normalizeSummaryFilter(label);
  const items = getActiveTargetEntities(data);

  switch (filter) {
    case "total":
      return items;

    case "progress":
      return items.filter(isProgressItem);

    default:
      return items.filter((item) => item.status === filter);
  }
}

function isProgressItem(item: OperationSummaryRow | TodaySummaryRow): boolean {
  return isRunningStatus(item.status);
}

function normalizeSummaryFilter(label: string): SummaryFilter {
  return label.trim().toLowerCase();
}

