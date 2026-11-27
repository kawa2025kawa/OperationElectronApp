// src/renderer/features/operation/components/table/operationTableConfig.ts

import {
  columnFilteringFeature,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import { EMPTY_VALUE_FALLBACK } from "@renderer/utils/rendererUtils";
import {
  matchesSummaryStatusFilter,
  OPERATION_FIELD_LABELS,
  toDisplayValue,
} from "@renderer/features/operation/utils/operationDisplayUtils";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import * as styles from "./operationTable.css";

export const OPERATION_TABLE_FEATURES = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
});

export type TableFeaturesType = typeof OPERATION_TABLE_FEATURES;

export interface OperationColumnMeta {
  readonly label: string;
  readonly width: string;
  readonly align?: keyof typeof styles.alignVariants;
}

const OPERATION_COLUMN_CONFIG = {
  kanriNo: {
    label: OPERATION_FIELD_LABELS.kanriNo,
    width: "90px",
    align: "left",
  },
  workType: {
    label: OPERATION_FIELD_LABELS.workType,
    width: "90px",
    align: "center",
  },
  scheduledTime: {
    label: OPERATION_FIELD_LABELS.scheduledTime,
    width: "120px",
    align: "left",
  },
  cycle: {
    label: OPERATION_FIELD_LABELS.cycle,
    width: "140px",
    align: "left",
  },
  cycle1: {
    label: "サイクル1",
    width: "140px",
    align: "left",
  },
  cycle2: {
    label: "サイクル2",
    width: "140px",
    align: "left",
  },
  workName: {
    label: OPERATION_FIELD_LABELS.workName,
    width: "auto",
    align: "left",
  },
  jobId: {
    label: OPERATION_FIELD_LABELS.jobId,
    width: "auto",
    align: "left",
  },
  status: {
    label: OPERATION_FIELD_LABELS.status,
    width: "140px",
    align: "center",
  },
} as const satisfies Record<string, OperationColumnMeta>;

export type OperationColumn = keyof typeof OPERATION_COLUMN_CONFIG;

const COMMON_OPERATION_TODAY_COLUMNS = [
  "kanriNo",
  "workType",
  "scheduledTime",
  "workName",
  "status",
] as const satisfies readonly OperationColumn[];

const VISIBLE_OPERATION_COLUMNS = {
  operation: [
    "kanriNo",
    "workType",
    "scheduledTime",
    "workName",
    "jobId",
    "status",
  ],
  irregular: ["kanriNo", "scheduledTime", "cycle1", "cycle2", "workName"],
  today: COMMON_OPERATION_TODAY_COLUMNS,
} as const satisfies Record<ViewMode, readonly OperationColumn[]>;

function getCellValue(row: OperationViewItem, column: OperationColumn): string {
  if (!Object.prototype.hasOwnProperty.call(row, column)) {
    return EMPTY_VALUE_FALLBACK;
  }

  return toDisplayValue((row as unknown as Record<string, unknown>)[column]);
}

function buildColumnsFromIds(
  columnIds: readonly OperationColumn[],
): ColumnDef<TableFeaturesType, OperationViewItem>[] {
  return columnIds.map((id) => ({
    id,
    header: OPERATION_COLUMN_CONFIG[id].label,
    accessorFn: (row) => getCellValue(row, id),
    ...(id === "status"
      ? {
          filterFn: (row, _columnId, filterValue) => {
            if (!filterValue) return true;
            return matchesSummaryStatusFilter(row.original.status, filterValue);
          },
        }
      : {}),
    size:
      id === "kanriNo" || id === "workType"
        ? 90
        : id === "scheduledTime"
          ? 120
          : id === "status"
            ? 140
            : 0,
    meta: OPERATION_COLUMN_CONFIG[id],
  }));
}

const CACHED_OPERATION_COLUMNS: Record<
  ViewMode,
  ColumnDef<TableFeaturesType, OperationViewItem>[]
> = {
  operation: buildColumnsFromIds(VISIBLE_OPERATION_COLUMNS.operation),
  irregular: buildColumnsFromIds(VISIBLE_OPERATION_COLUMNS.irregular),
  today: buildColumnsFromIds(VISIBLE_OPERATION_COLUMNS.today),
};

const CACHED_SUMMARY_TABLE_COLUMNS: ColumnDef<
  TableFeaturesType,
  OperationViewItem
>[] = buildColumnsFromIds(COMMON_OPERATION_TODAY_COLUMNS);

export function getOperationColumns(
  mode: ViewMode,
  isSummaryFiltered = false,
): ColumnDef<TableFeaturesType, OperationViewItem>[] {
  return isSummaryFiltered
    ? CACHED_SUMMARY_TABLE_COLUMNS
    : CACHED_OPERATION_COLUMNS[mode];
}
