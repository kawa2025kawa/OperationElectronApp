import { format, subDays } from "date-fns";

/**
 * 日付を指定形式の文字列に変換する。
 *
 * 既定値: yyyyMMdd
 */
export function getDateKey(
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(date, pattern);
}

/**
 * 指定日数分、過去または未来の日付キーを取得する。
 *
 * days が正数: 過去
 * days が負数: 未来
 */
export function getDateKeyOffset(
  days: number,
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(subDays(date, days), pattern);
}

/**
 * 日時を指定形式の文字列に変換する。
 *
 * 既定値: yyyy/MM/dd HH:mm:ss
 */
export function formatDateTime(
  date: Date,
  pattern = "yyyy/MM/dd HH:mm:ss",
): string {
  return format(date, pattern);
}

/**
 * 指定時刻を基準に、処理対象ディレクトリを選択する。
 *
 * cutoffHour:cutoffMinute 以降は afterDir、
 * それより前は beforeDir を返す。
 */
export function selectDirectoryByTime(
  date: Date,
  beforeDir: string,
  afterDir: string,
  cutoffHour: number,
  cutoffMinute: number,
): string {
  if (!Number.isInteger(cutoffHour) || cutoffHour < 0 || cutoffHour > 23) {
    throw new Error(`cutoffHour が不正です: ${cutoffHour}`);
  }

  if (
    !Number.isInteger(cutoffMinute) ||
    cutoffMinute < 0 ||
    cutoffMinute > 59
  ) {
    throw new Error(`cutoffMinute が不正です: ${cutoffMinute}`);
  }

  const cutoff = new Date(date);
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

  return date.getTime() >= cutoff.getTime() ? afterDir : beforeDir;
}
