// src/renderer/features/spreadSheet/utils/spreadsheetDateUtils.ts

import { TZDate } from "@date-fns/tz";
import holidayJp from "@holiday-jp/holiday_jp";
import { addDays, format, getDay, isValid } from "date-fns";
import { ja } from "date-fns/locale/ja";

const JST_TIME_ZONE = "Asia/Tokyo" as const;

export type DayTone = "weekday" | "saturday" | "holiday";

/** 日本の祝日（振替休日・国民の休日を含む）かを判定する */
export function isJapaneseHoliday(date: Date): boolean {
  return holidayJp.isHoliday(date);
}

export const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

export const getOffsetDate = (
  offsetDays: number,
  baseDate: Date = new Date(),
): Date => addDays(baseDate, offsetDays);

/** UpdateMetaData の updatedAt（JST基準）からヘッダー表示用の基準日を解決する */
export function resolveScheduleBaseDate(updatedAt?: string | null): Date {
  if (updatedAt) {
    const parsed = new Date(updatedAt);
    if (isValid(parsed)) {
      const jst = new TZDate(parsed, JST_TIME_ZONE);
      return new Date(jst.getFullYear(), jst.getMonth(), jst.getDate());
    }
  }

  return new Date();
}

export function formatDateWithDay(date: Date) {
  const dayNum = getDay(date);
  const holiday = isJapaneseHoliday(date);
  const tone: DayTone =
    dayNum === 0 || holiday ? "holiday" : dayNum === 6 ? "saturday" : "weekday";

  return {
    text: format(date, "MM/dd"),
    dayText: `(${format(date, "EEE", { locale: ja })})`,
    tone,
  };
}