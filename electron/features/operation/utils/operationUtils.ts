// electron/features/operation/utils/operationUtils.ts

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
 * 日付をログ出力用の日時文字列へ変換する。
 *
 * @example
 * 2026/09/28 13:45:00
 */
export function formatLogDateTime(date: Date | number = new Date()): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

/**
 * 指定した日付（または現在日）を yyyyMMdd 形式で取得する。
 *
 * @example
 * 20260928
 */
export function getTodayYmd(date: Date = new Date()): string {
  return format(date, "yyyyMMdd");
}
