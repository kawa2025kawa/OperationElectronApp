// src/renderer/features/operation/components/table/operationTable.utils.ts

import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/operationDisplayUtils";

import {
  OPERATION_COLUMN_CONFIG,
  VISIBLE_OPERATION_COLUMNS,
  type OperationColumn,
  type OperationColumnMeta,
} from "./operationTableConfig";
import * as styles from "./operationTable.css";

type AlignmentVariant = keyof typeof styles.alignVariants;

/** 表示モードに対応する列を取得する。 */
export function getVisibleOperationColumns(
  mode: ViewMode,
): readonly OperationColumn[] {
  return VISIBLE_OPERATION_COLUMNS[mode];
}

/** 列のメタデータを取得する。 */
// 列のメタデータを取得する。
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
