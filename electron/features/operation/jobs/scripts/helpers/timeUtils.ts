// electron/features/operation/jobs/scripts/helpers/timeUtils.ts

import { format } from "date-fns";
import fs from "fs-extra";

/**
 * フォルダが存在するか確認する共通関数
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
 * 日付を指定形式の文字列に変換する。既定値: yyyyMMdd
 */
export function getDateKey(
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(date, pattern);
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
