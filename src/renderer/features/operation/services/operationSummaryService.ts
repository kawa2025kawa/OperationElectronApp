// src/renderer/features/operation/services/operationSummaryService.ts

import type { AppState } from "@renderer/store";

import {
  JOB_STATUS,
  type OperationItem,
} from "@shared/types/operation/operationTypes";

import { calculateSummary } from "@renderer/features/operation/helpers/operationEntities";

/* ============================================================================
 * Types
 * ========================================================================== */

type SummaryFilter = "total" | "progress" | string;

/* ============================================================================
 * Target Entities
 * ========================================================================== */

/**
 * サマリー集計対象となる OperationItem を取得する。
 *
 * 対象:
 * - Operation は全件
 * - Irregular は todayIds に含まれるもののみ
 *
 * todayIds は kanriNo の集合として扱う。
 */
export function getActiveTargetEntities(state: AppState): OperationItem[] {
  const operations = Object.values(state.operationEntities);

  const todayIds = new Set(state.todayIds.map(normalizeKanriNo));

  const todayIrregulars = Object.values(state.irregularEntities).filter(
    (item) => todayIds.has(normalizeKanriNo(item.kanriNo)),
  );

  return [...operations, ...todayIrregulars];
}

/* ============================================================================
 * Summary
 * ========================================================================== */

/**
 * 現在の Store state からサマリーを再計算する。
 */
export function refreshSummary(state: AppState): void {
  state.summary = calculateSummary(getActiveTargetEntities(state), {
    is1CActive: state.is1CActive,

    is2CActive: state.is2CActive,

    is3CActive: state.is3CActive,
  });
}

/* ============================================================================
 * Summary Filtering
 * ========================================================================== */

/**
 * サマリー表示項目に対応する OperationItem を取得する。
 *
 * filter:
 * - total
 *     → 集計対象全件
 * - progress
 *     → 実行中 / スクリプト実行中
 * - JobStatus
 *     → 指定 status の項目
 *
 * status は Store 内では常に JobStatus に正規化済みなので、
 * 大文字小文字変換や raw string の normalization は行わない。
 */
export function filterSummaryItems(
  state: AppState,
  label: string,
): OperationItem[] {
  const filter = normalizeSummaryFilter(label);

  const items = getActiveTargetEntities(state);

  switch (filter) {
    case "total":
      return items;

    case "progress":
      return items.filter(isProgressItem);

    default:
      return items.filter((item) => item.status === filter);
  }
}

/* ============================================================================
 * Predicates
 * ========================================================================== */

/**
 * 進捗中として扱う status かどうか。
 *
 * progress:
 * - running
 * - scriptRunning
 */
function isProgressItem(item: OperationItem): boolean {
  return (
    item.status === JOB_STATUS.RUNNING ||
    item.status === JOB_STATUS.SCRIPT_RUNNING
  );
}

/* ============================================================================
 * Normalization
 * ========================================================================== */

/**
 * kanriNo を比較用の文字列へ正規化する。
 *
 * entity 側の kanriNo は string だが、
 * todayIds 側との比較では将来的な型差も吸収できるようにする。
 */
function normalizeKanriNo(kanriNo: string | number): string {
  return String(kanriNo).trim();
}

/**
 * サマリーフィルタ文字列を正規化する。
 *
 * total / progress は UI 側の固定キー。
 * それ以外は JobStatus として扱う。
 *
 * JobStatus 自体は lowercase の固定値なので、
 * UI から大文字で渡された場合だけ小文字化する。
 */
function normalizeSummaryFilter(label: string): SummaryFilter {
  return label.trim().toLowerCase();
}
