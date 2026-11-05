// src/renderer/features/operation/components/modal/summaryModal/useSummaryModalContent.ts

import { useCallback } from "react";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";
import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/utils/operationDisplayUtils";

export type RowState = "selected" | "clickable" | "idle";

export interface CellValueResult {
  exists: boolean;
  value: unknown;
}

export const useSummaryModalContent = (items: SummaryDetailRow[] = []) => {
  const isEmpty = items.length === 0;

  // セル値の存在確認と安全な取り出し
  const getCellValue = useCallback(
    (item: SummaryDetailRow, key: string): CellValueResult => {
      if (!Object.prototype.hasOwnProperty.call(item, key)) {
        return { exists: false, value: undefined };
      }
      return {
        exists: true,
        value: (item as unknown as Record<string, unknown>)[key],
      };
    },
    [],
  );

  // 表示用テキストの整形
  const formatCellDisplay = useCallback(
    (item: SummaryDetailRow, key: string): string => {
      const cell = getCellValue(item, key);
      return cell.exists
        ? toDisplayValue(cell.value)
        : toMissingPropertyDisplayValue();
    },
    [getCellValue],
  );

  // 行の選択/操作状態の導出
  const getRowState = useCallback(
    (isSelected: boolean, hasClickHandler: boolean): RowState => {
      if (isSelected) return "selected";
      if (hasClickHandler) return "clickable";
      return "idle";
    },
    [],
  );

  // 一意キーの生成
  const getRowKey = useCallback(
    (item: SummaryDetailRow, index: number): string => {
      return item.kanriNo || String(index);
    },
    [],
  );

  return {
    isEmpty,
    items,
    getCellValue,
    formatCellDisplay,
    getRowState,
    getRowKey,
  };
};
