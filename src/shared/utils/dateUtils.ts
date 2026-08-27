import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 日付オブジェクトにオフセット日数を加算して取得
 */
export const getOffsetDate = (offsetDays: number): Date => {
  return addDays(new Date(), offsetDays);
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

/**
 * scheduledTime (例: "9:22" や "14:00") が現在時刻を過ぎているか判定する
 * @param scheduledTimeStr "HH:mm" 形式の文字列
 * @param now 比較対象の現在時刻（デフォルト: new Date()）
 * @returns 予定時刻を過ぎている（または時刻指定がない）場合は true、予定時刻前なら false
 */
export const isScheduledTimePassed = (
  scheduledTimeStr?: string | null,
  now = new Date(),
): boolean => {
  if (!scheduledTimeStr || !scheduledTimeStr.trim()) {
    return true; // 時刻指定がない場合は制限なし（到達済み扱い）
  }

  const parts = scheduledTimeStr.trim().split(":");
  if (parts.length < 2) {
    return true; // フォーマット不正の場合も通過
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return true;
  }

  const scheduledDate = new Date(now);
  scheduledDate.setHours(hours, minutes, 0, 0);

  return now >= scheduledDate;
};

/**
 * 実行開始時刻(startTime)から kanshiTime (タイムアウト閾値 例: "1:00" や "60") を超過したか判定
 */
export const isJobTimedOut = (
  startTimeStr?: string | null,
  kanshiTimeStr?: string | null,
  now = new Date(),
): boolean => {
  if (
    !startTimeStr ||
    !kanshiTimeStr ||
    !startTimeStr.trim() ||
    !kanshiTimeStr.trim()
  ) {
    return false;
  }

  // kanshiTime のパース ("HH:mm" 形式 または 単純な「分」指定に対応)
  const trimmedKanshi = kanshiTimeStr.trim();
  let timeoutMinutes: number;

  if (trimmedKanshi.includes(":")) {
    const parts = trimmedKanshi.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    timeoutMinutes = h * 60 + m;
  } else {
    timeoutMinutes = parseInt(trimmedKanshi, 10) || 0;
  }

  if (timeoutMinutes <= 0) return false;

  // startTime ("HH:mm" または "HH:mm:ss") のパース
  const startParts = startTimeStr.trim().split(":");
  if (startParts.length < 2) return false;

  const startHours = parseInt(startParts[0], 10);
  const startMinutes = parseInt(startParts[1], 10);
  if (isNaN(startHours) || isNaN(startMinutes)) return false;

  const startDate = new Date(now);
  startDate.setHours(startHours, startMinutes, 0, 0);

  // 経過時間（ミリ秒）と タイムアウト時間（ミリ秒）の比較
  const elapsedMs = now.getTime() - startDate.getTime();
  const timeoutMs = timeoutMinutes * 60 * 1000;

  return elapsedMs > timeoutMs;
};
