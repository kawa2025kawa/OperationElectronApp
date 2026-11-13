// src/renderer/features/operation/components/table/operationTableConfig.ts

import {
  columnFilteringFeature,
  createFilteredRowModel,
  globalFilteringFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/utils/operationDisplayUtils";
import {
  OPERATION_FIELD_LABELS,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
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

export const OPERATION_COLUMN_CONFIG = {
  kanriNo: {
    label: OPERATION_FIELD_LABELS.kanriNo,
    width: "90px",
    align: "left",
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

export const VISIBLE_OPERATION_COLUMNS = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: ["kanriNo", "scheduledTime", "cycle1", "cycle2", "workName"],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
} as const satisfies Record<ViewMode, readonly OperationColumn[]>;

export const EMPTY_OPERATION_ROWS: OperationViewItem[] = [];

export function getOperationColumnMeta(
  column: OperationColumn,
): OperationColumnMeta {
  return OPERATION_COLUMN_CONFIG[column];
}

export function getOperationColumnAlignment(column: OperationColumn): string {
  const alignment = getOperationColumnMeta(column).align ?? "left";
  return styles.alignVariants[alignment];
}

export function getCellValue(
  row: OperationViewItem,
  column: OperationColumn,
): string {
  if (!Object.prototype.hasOwnProperty.call(row, column)) {
    return toMissingPropertyDisplayValue();
  }

  return toDisplayValue((row as unknown as Record<string, unknown>)[column]);
}

export function getOperationColumns(
  mode: ViewMode,
): ColumnDef<TableFeaturesType, OperationViewItem>[] {
  return VISIBLE_OPERATION_COLUMNS[mode].map((id) => ({
    id,
    header: getOperationColumnMeta(id).label,
    accessorFn: (row) => getCellValue(row, id),
    size:
      id === "kanriNo"
        ? 90
        : id === "scheduledTime"
          ? 120
          : id === "status"
            ? 140
            : 0,
    meta: getOperationColumnMeta(id),
  }));
}
