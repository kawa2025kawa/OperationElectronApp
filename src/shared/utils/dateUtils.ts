// src/shared/utils/dateUtils.ts

import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";

/** 日本語の曜日配列（0:日 〜 6:土） */
export const JAPANESE_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 今日の日付に対する「M/D (曜日)」形式の文字列を取得 */
export const formatDayWithWeekday = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()} (${JAPANESE_WEEKDAYS[date.getDay()]})`;
};

/** YYYYMMDD形式へのフォーマット */
export const formatDateYYYYMMDD = (date: Date): string => {
  return format(date, "yyyyMMdd");
};

/** YYMMDD形式へのフォーマット（下6桁） */
export const formatDateYYMMDD = (date: Date): string => {
  return format(date, "yyMMdd");
};

/** YYYY-MM-DD形式へのフォーマット */
export const formatDateYYYY_MM_DD = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/** YYYY/MM/DD形式へのフォーマット */
export const formatDateSlash = (date: Date): string => {
  return format(date, "yyyy/MM/dd");
};

/** MM/DD(曜日)形式（日本語表示用） */
export const formatDateForHeader = (date: Date): string => {
  return format(date, "MM/dd(EEE)", { locale: ja });
};

/**
 * 指定された日付オブジェクトまたは文字列から、指定されたフォーマットの文字列を生成します
 */
export const formatDate = (
  dateInput: Date | string | null | undefined,
  formatStr: string = "yyyy/MM/dd",
): string => {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  return format(date, formatStr, { locale: ja });
};

/**
 * 本日の日付を基準に、指定した日数分移動（加算・減算）した日付オブジェクトを取得します
 */
export const getOffsetDate = (offsetDays: number): Date => {
  return addDays(new Date(), offsetDays);
};

export const formatToJapaneseDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return format(date, "yyyy年MM月dd日 HH時mm分", { locale: ja });
};
