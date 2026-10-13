// src/renderer/features/operation/helpers/entityUtils.ts

import type { OperationViewItem } from "@shared/types/operation/operationTypes";

/**
 * テーブル行配列から管理Noに該当する行データを検索する
 */
export function findRowByKanriNo(
  rows: OperationViewItem[],
  kanriNo: string,
): OperationViewItem | undefined {
  if (!kanriNo) return undefined;
  const cleanKanriNo = String(kanriNo).trim();
  return rows.find((item) => String(item.kanriNo).trim() === cleanKanriNo);
}
