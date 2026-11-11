// src/renderer/features/operation/components/table/operationTableConfig.ts

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

// 列定義

export interface OperationColumnMeta {
  readonly label: string;
  readonly width: string;
  readonly align?: keyof typeof styles.alignVariants;
}

export const OPERATION_COLUMN_CONFIG = {
  kanriNo: {
    label: OPERATION_FIELD_LABELS.kanriNo,
    width: "90px",
  },
  scheduledTime: {
    label: OPERATION_FIELD_LABELS.scheduledTime,
    width: "120px",
  },
  cycle: {
    label: OPERATION_FIELD_LABELS.cycle,
    width: "140px",
  },
  cycle1: {
    label: "サイクル1",
    width: "140px",
  },
  cycle2: {
    label: "サイクル2",
    width: "140px",
  },
  workName: {
    label: OPERATION_FIELD_LABELS.workName,
    width: "auto",
  },
  jobId: {
    label: OPERATION_FIELD_LABELS.jobId,
    width: "auto",
  },
  status: {
    label: OPERATION_FIELD_LABELS.status,
    width: "140px",
  },
} as const satisfies Record<string, OperationColumnMeta>;

export type OperationColumn = keyof typeof OPERATION_COLUMN_CONFIG;

// 表示モードごとの列定義

export const VISIBLE_OPERATION_COLUMNS = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: ["kanriNo", "scheduledTime", "cycle1", "cycle2", "workName"],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
} as const satisfies Record<ViewMode, readonly OperationColumn[]>;

// 空データ

export const EMPTY_OPERATION_ROWS = [] as const;

// 列定義の取得

export function getVisibleOperationColumns(
  mode: ViewMode,
): readonly OperationColumn[] {
  return VISIBLE_OPERATION_COLUMNS[mode];
}

export function getOperationColumnMeta(
  column: OperationColumn,
): OperationColumnMeta {
  return OPERATION_COLUMN_CONFIG[column];
}

export function getOperationColumnAlignment(column: OperationColumn): string {
  const alignment = getOperationColumnMeta(column).align ?? "left";

  return styles.alignVariants[alignment];
}

// セル表示値の取得

export function getOperationCellDisplayValue(
  row: OperationViewItem,
  column: OperationColumn,
): string {
  if (!Object.prototype.hasOwnProperty.call(row, column)) {
    return toMissingPropertyDisplayValue();
  }

  const value = (row as unknown as Record<string, unknown>)[column];

  return toDisplayValue(value);
}
