// src/shared/utils/dateUtils.ts

import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale/ja";
import type { ScheduledTime } from "@shared/types/operation/operationTypes";

export const getOffsetDate = (offsetDays: number): Date =>
  addDays(new Date(), offsetDays);

export const formatToJapaneseDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja });
};

export const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

/**
 * ScheduledTime オブジェクトまたは文字列から時刻文字列を取り出す
 */
function extractTimeString(
  input?:
    | ScheduledTime
    | string
    | { time?: string; scheduledTime?: string }
    | null,
): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    if ("time" in input && typeof input.time === "string") return input.time;
    if ("scheduledTime" in input && typeof input.scheduledTime === "string")
      return input.scheduledTime;
  }
  return null;
}

/**
 * ジョブの監視時間（タイムアウト）超過判定
 */
export const isJobTimedOut = (
  startTimeStr?: string | null,
  kanshiTimeStr?: string | null,
  now = new Date(),
): boolean => {
  if (!startTimeStr?.trim() || !kanshiTimeStr?.trim()) return false;

  const kanshi = kanshiTimeStr.trim();
  const timeoutMinutes = kanshi.includes(":")
    ? (parseInt(kanshi.split(":")[0] ?? "0", 10) || 0) * 60 +
      (parseInt(kanshi.split(":")[1] ?? "0", 10) || 0)
    : parseInt(kanshi, 10);

  if (!timeoutMinutes || isNaN(timeoutMinutes) || timeoutMinutes <= 0) {
    return false;
  }

  const [startH, startM] = startTimeStr.trim().split(":").map(Number);
  if (
    startH === undefined ||
    startM === undefined ||
    isNaN(startH) ||
    isNaN(startM)
  ) {
    return false;
  }

  const startDate = new Date(now);
  startDate.setHours(startH, startM, 0, 0);
  if (startDate > now) {
    startDate.setDate(startDate.getDate() - 1);
  }

  return now.getTime() - startDate.getTime() > timeoutMinutes * 60 * 1000;
};
