// electron/features/masterData/application/jstDate.ts

export const JST_TIME_ZONE = "Asia/Tokyo" as const;

export const WEEKDAY_MAP: Readonly<Record<string, string>> = {
  Mon: "月",
  Tue: "火",
  Wed: "水",
  Thu: "木",
  Fri: "金",
  Sat: "土",
  Sun: "日",
};

export interface JstDatePartsResult {
  year: number;
  month: number;
  day: number;
  weekday: string;
  lastDay: number;
}

// 日本時間の年月日・曜日・月末日を取得する。
export function getJstDateParts(value: Date): JstDatePartsResult {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(value);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));

  return {
    year,
    month,
    day,
    weekday: WEEKDAY_MAP[getPart("weekday")] ?? "",
    lastDay: new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
}

// 指定日時を日本時間の YYYY-MM-DD 形式に変換する。
export function getJstDateKey(value: Date): string {
  const { year, month, day } = getJstDateParts(value);

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

// 指定日時が現在の日本時間の日付と一致するか判定する。
export function isSameJstDay(value: string): boolean {
  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    getJstDateKey(date) === getJstDateKey(new Date())
  );
}
