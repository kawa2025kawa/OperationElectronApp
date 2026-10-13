// src/renderer/features/operation/services/internal/operationExecutionUtils.ts

import type { OperationViewItem } from "@shared/types/operation/operationTypes";

/**
 * エラーオブジェクトから安全にメッセージ文字列を抽出
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * テーブル行一覧から指定管理Noのデータ行を検索（存在しない場合は例外）
 */
export function requireOperationRow(
  rows: OperationViewItem[],
  kanriNo: string,
): OperationViewItem {
  const found = rows.find((row) => row.kanriNo === kanriNo);

  if (!found) {
    throw new Error(`対象データが存在しません: ${kanriNo}`);
  }

  return found;
}
