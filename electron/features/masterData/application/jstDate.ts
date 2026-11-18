// electron/features/masterData/application/jstDate.ts

import { TZDate } from "@date-fns/tz";
import { format, getDaysInMonth, isValid } from "date-fns";

const JST_TIME_ZONE = "Asia/Tokyo" as const;

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export interface JstDatePartsResult {
  year: number;
  month: number;
  day: number;
  weekday: string;
  lastDay: number;
}

// 日本時間の年月日・曜日・月末日を取得する
export function getJstDateParts(value: Date): JstDatePartsResult {
  const jst = new TZDate(value, JST_TIME_ZONE);

  return {
    year: jst.getFullYear(),
    month: jst.getMonth() + 1,
    day: jst.getDate(),
    weekday: WEEKDAY_JA[jst.getDay()] ?? "",
    lastDay: getDaysInMonth(jst),
  };
}

// 指定日時を日本時間の YYYY-MM-DD 形式に変換する
function getJstDateKey(value: Date): string {
  return format(new TZDate(value, JST_TIME_ZONE), "yyyy-MM-dd");
}

// 指定日時が現在の日本時間の日付と一致するか判定する
export function isSameJstDay(value: string): boolean {
  const date = new Date(value);

  return isValid(date) && getJstDateKey(date) === getJstDateKey(new Date());
}