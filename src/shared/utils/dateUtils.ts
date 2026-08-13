// src/shared/utils/dateUtils.ts
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 日付オブジェクトにオフセット日数を加算して取得
 */
export const getOffsetDate = (offsetDays: number): Date => {
  return addDays(new Date(), offsetDays);
};

/**
 * 日付を指定フォーマットの文字列に変換 (デフォルト: yyyy/MM/dd)
 */
export const formatDate = (
  dateInput: Date | string | null | undefined,
  formatStr = "yyyy/MM/dd",
): string => {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return format(date, formatStr, { locale: ja });
};

/**
 * 日本語の日時フォーマット (例: 2026年08月12日 10:08)
 */
export const formatToJapaneseDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return format(date, "yyyy年MM月dd日 HH:mm", { locale: ja });
};

/**
 * テーブルヘッダー用フォーマット (例: 08/12(水))
 */
export const formatDateForHeader = (date: Date): string => {
  return format(date, "MM/dd(EEE)", { locale: ja });
};
