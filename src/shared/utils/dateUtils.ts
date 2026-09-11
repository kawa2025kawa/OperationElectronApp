// src/shared/utils/dateUtils.ts

import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import type { ScheduledTime } from "@shared/types/operation";

export const getOffsetDate = (offsetDays: number): Date => {
  return addDays(new Date(), offsetDays);
};

export const formatToJapaneseDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja });
};

export const formatDateForHeader = (date: Date): string => {
  return format(date, "MM/dd(EEE)", { locale: ja });
};

/**
 * 予定時刻（AM/PMまたは "HH:mm"）を過ぎているかを判定
 */
export const isScheduledTimePassed = (
  scheduledTimeStr?: ScheduledTime | string | null,
  isPreviousDay = false,
  now = new Date(),
): boolean => {
  if (!scheduledTimeStr?.trim()) return true;
  const str = scheduledTimeStr.trim().toUpperCase();

  let targetHour: number;
  let targetMinute = 0;

  if (str === "AM") {
    targetHour = 0;
  } else if (str === "PM") {
    targetHour = 12;
  } else {
    const parts = str.split(":").map((p) => parseInt(p.trim(), 10));
    targetHour = parts[0] ?? NaN;
    targetMinute = parts[1] ?? 0;
    if (isNaN(targetHour) || isNaN(targetMinute)) return false;
  }

  const scheduledDate = new Date(now);
  scheduledDate.setHours(targetHour, targetMinute, 0, 0);

  if (isPreviousDay) {
    scheduledDate.setDate(scheduledDate.getDate() - 1);
  }

  return now >= scheduledDate;
};

/**
 * ジョブの実行タイムアウト判定
 */
export const isJobTimedOut = (
  startTimeStr?: string | null,
  kanshiTimeStr?: string | null,
  now = new Date(),
): boolean => {
  if (!startTimeStr?.trim() || !kanshiTimeStr?.trim()) return false;
  const kanshi = kanshiTimeStr.trim();

  const timeoutMinutes = kanshi.includes(":")
    ? (parseInt(kanshi.split(":")[0], 10) || 0) * 60 +
      (parseInt(kanshi.split(":")[1], 10) || 0)
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
