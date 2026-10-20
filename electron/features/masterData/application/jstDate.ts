// electron/features/masterData/application/jstDate.ts

const JST_TIME_ZONE = "Asia/Tokyo";

// 指定日時を日本時間の YYYY-MM-DD 形式に変換する。
export function getJstDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

// 指定日時が現在の日本時間の日付と一致するか判定する。
export function isSameJstDay(value: string): boolean {
  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    getJstDateKey(date) === getJstDateKey(new Date())
  );
}
