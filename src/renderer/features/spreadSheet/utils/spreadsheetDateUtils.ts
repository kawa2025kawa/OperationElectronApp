// src/renderer/features/spreadSheet/utils/spreadsheetDateUtils.ts

import { addDays, format, getDay, subDays } from "date-fns";
import { ja } from "date-fns/locale/ja";

export type DayTone = "weekday" | "saturday" | "holiday";

function getNthMondayDay(year: number, month: number, nth: number): number {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const offsetToMonday = (8 - firstDayOfWeek) % 7;
  return 1 + offsetToMonday + (nth - 1) * 7;
}

function getVernalEquinoxDay(year: number): number {
  return Math.floor(
    20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function getAutumnalEquinoxDay(year: number): number {
  return Math.floor(
    23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function isBaseJapaneseHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 固定祝日
  if (month === 1 && day === 1) return true; // 元日
  if (month === 2 && day === 11) return true; // 建国記念の日
  if (month === 2 && day === 23) return true; // 天皇誕生日
  if (month === 4 && day === 29) return true; // 昭和の日
  if (month === 5 && day === 3) return true; // 憲法記念日
  if (month === 5 && day === 4) return true; // みどりの日
  if (month === 5 && day === 5) return true; // こどもの日
  if (month === 8 && day === 11) return true; // 山の日
  if (month === 11 && day === 3) return true; // 文化の日
  if (month === 11 && day === 23) return true; // 勤労感謝の日

  // ハッピーマンデー
  if (month === 1 && day === getNthMondayDay(year, 1, 2)) return true; // 成人の日
  if (month === 7 && day === getNthMondayDay(year, 7, 3)) return true; // 海の日
  if (month === 9 && day === getNthMondayDay(year, 9, 3)) return true; // 敬老の日
  if (month === 10 && day === getNthMondayDay(year, 10, 2)) return true; // スポーツの日

  // 春分の日・秋分の日
  if (month === 3 && day === getVernalEquinoxDay(year)) return true;
  if (month === 9 && day === getAutumnalEquinoxDay(year)) return true;

  return false;
}

/** 日本の祝日（振替休日・国民の休日を含む）かを判定する */
export function isJapaneseHoliday(date: Date): boolean {
  if (isBaseJapaneseHoliday(date)) {
    return true;
  }

  // 振替休日：祝日が日曜にあたるとき、その日後においてその日に最も近い「国民の祝日」でない日
  if (getDay(date) !== 0) {
    let cursor = subDays(date, 1);
    while (isBaseJapaneseHoliday(cursor)) {
      if (getDay(cursor) === 0) {
        return true;
      }
      cursor = subDays(cursor, 1);
    }
  }

  // 国民の休日：前日と翌日がともに祝日である平日
  if (
    getDay(date) !== 0 &&
    isBaseJapaneseHoliday(subDays(date, 1)) &&
    isBaseJapaneseHoliday(addDays(date, 1))
  ) {
    return true;
  }

  return false;
}

export const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

export const getOffsetDate = (
  offsetDays: number,
  baseDate: Date = new Date(),
): Date => addDays(baseDate, offsetDays);

export function formatDateWithDay(date: Date) {
  const dayNum = getDay(date);
  const holiday = isJapaneseHoliday(date);
  const tone: DayTone =
    dayNum === 0 || holiday ? "holiday" : dayNum === 6 ? "saturday" : "weekday";
  const dayColor =
    tone === "holiday"
      ? "#ff4d4f"
      : tone === "saturday"
        ? "#3b9eff"
        : "inherit";

  return {
    text: format(date, "MM/dd"),
    dayText: `(${format(date, "EEE", { locale: ja })})`,
    tone,
    dayStyle: { color: dayColor },
  };
}
