// src/renderer/features/operation/components/table/operationTableConfig.ts

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/operationDisplayUtils";
import {
  OPERATION_FIELD_LABELS,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import * as styles from "./operationTable.css";

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
    width: "100px",
    align: "center",
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
    align: "center",
  },
} as const satisfies Record<string, OperationColumnMeta>;

export type OperationColumn = keyof typeof OPERATION_COLUMN_CONFIG;

export const VISIBLE_OPERATION_COLUMNS = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: ["kanriNo", "scheduledTime", "cycle", "workName"],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
} as const satisfies Record<ViewMode, readonly OperationColumn[]>;

export const EMPTY_OPERATION_ROWS = [] as const;

type AlignmentVariant = keyof typeof styles.alignVariants;

/** 表示モードに対応する列を取得する。 */
export function getVisibleOperationColumns(
  mode: ViewMode,
): readonly OperationColumn[] {
  return VISIBLE_OPERATION_COLUMNS[mode];
}

/** 列のメタデータを取得する。 */
export function getOperationColumnMeta(
  column: OperationColumn,
): OperationColumnMeta {
  return OPERATION_COLUMN_CONFIG[column];
}

/** 列の配置に対応する CSS クラスを取得する。 */
export function getOperationColumnAlignment(column: OperationColumn): string {
  const alignment: AlignmentVariant =
    getOperationColumnMeta(column).align ?? "left";

  return styles.alignVariants[alignment] ?? styles.alignVariants.left;
}

/**
 * セルの表示値を取得する。
 * プロパティが存在しない場合に限り、欠損プレースホルダーを返す。
 */
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
