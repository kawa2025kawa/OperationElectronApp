// electron/features/operation/jobs/scripts/helpers/timeUtils.ts

import { format, subDays, isSameDay } from "date-fns";
import fs from "fs-extra";

/**
 * ディレクトリが存在するか確認する共通関数
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * ファイルが存在するか確認する共通関数
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * 本日更新されたファイルかどうかを判定する共通関数
 */
export function isUpdatedToday(date: Date, now: Date = new Date()): boolean {
  return isSameDay(date, now);
}

/**
 * 日付を指定形式の文字列に変換する。既定値: yyyyMMdd
 */
export function getDateKey(
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(date, pattern);
}

/**
 * yyyy-MM-dd 形式の当日日付を取得する。
 */
export function getTodayHyphen(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * 指定日数分、過去または未来の日付キーを取得する。
 */
export function getDateKeyOffset(
  days: number,
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(subDays(date, days), pattern);
}

/**
 * 日時を指定形式の文字列に変換する。既定値: yyyy/MM/dd HH:mm:ss
 */
export function formatDateTime(
  date: Date,
  pattern = "yyyy/MM/dd HH:mm:ss",
): string {
  return format(date, pattern);
}

/**
 * 指定時刻を基準に、処理対象ディレクトリを選択する。
 */
export function selectDirectoryByTime(
  date: Date,
  beforeDir: string,
  afterDir: string,
  cutoffHour: number,
  cutoffMinute: number,
): string {
  const cutoff = new Date(date);
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);
  return date.getTime() >= cutoff.getTime() ? afterDir : beforeDir;
}
