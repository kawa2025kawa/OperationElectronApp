// electron/features/operation/helpers/operationUtils.ts

import { format } from "date-fns";

export interface ParsedTime {
  hours: number;
  minutes: number;
}

/**
 * HH:mm形式の時刻を解析する。
 */
export function parseHHMM(value?: string | null): ParsedTime | null {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d{1,2}):(\d{1,2})/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return {
    hours,
    minutes,
  };
}

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
 *
 * 1. 管理番号が PREVIOUS_DAY_KANRI_NOS に含まれる
 * 2. scheduledTime に「前日」が含まれる
 *
 * どちらかを満たせば前日処理として扱う。
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
 * 日付をログ出力用の日時文字列へ変換する。
 *
 * @example
 * 2026/09/28 13:45:00
 */
export function formatLogDateTime(date: Date | number): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

/**
 * 現在日を yyyyMMdd 形式で取得する。
 *
 * @example
 * 20260928
 */
export function getTodayYmd(date: Date = new Date()): string {
  return format(date, "yyyyMMdd");
}

