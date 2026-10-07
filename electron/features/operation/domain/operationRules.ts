// electron/features/operation/domain/operationRules.ts

import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

/**
 * センターフラグのリスト
 */
export const CENTER_FLAGS: ReadonlySet<string> = new Set(["1C", "2C", "3C"]);

/**
 * 管理番号を標準的な文字列形式に正規化する。
 */
export function normalizeKanriNo(kanriNo: string | number): string {
  return String(kanriNo).trim();
}

/**
 * 前日処理として扱う管理番号。
 *
 * これらの管理番号は scheduledTime の時刻を
 * 前日基準として扱う。
 */
export const PREVIOUS_DAY_KANRI_NOS: ReadonlySet<string> = new Set([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);

/**
 * 指定されたジョブが前日処理か判定する。
 *
 * 判定条件:
 * 1. 管理番号が PREVIOUS_DAY_KANRI_NOS に含まれる
 * 2. scheduledTime に「前日」が含まれる
 */
export function isPreviousDayJob(
  kanriNo: string | number,
  scheduledTime?: string | null,
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);

  return (
    PREVIOUS_DAY_KANRI_NOS.has(normalizedKanriNo) ||
    scheduledTime?.includes("前日") === true
  );
}

/**
 * ターゲットが OperationMaster（通常タスク・jobIdを持つ）であるか判定する型ガード
 */
export function isOperationMasterTarget(
  target: unknown,
): target is OperationMaster {
  if (typeof target !== "object" || target === null) {
    return false;
  }

  const data = target as Record<string, unknown>;
  return typeof data.jobId === "string" && data.jobId.trim().length > 0;
}

/**
 * 依存関係リストの中にセンターフラグ(1C, 2C, 3C)が含まれているか判定する
 */
export function hasCenterFlagDependency(dependencies: string[]): boolean {
  return dependencies.some((dep) => CENTER_FLAGS.has(dep));
}
