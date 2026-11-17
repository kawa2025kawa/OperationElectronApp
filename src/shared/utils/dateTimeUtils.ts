// src/shared/utils/dateTimeUtils.ts

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const JAPAN_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/** Date オブジェクトを日本時間（YYYY/MM/DD HH:mm:ss）に整形する */
export function formatJapanDateTime(date: Date): string {
  return isValidDate(date) ? JAPAN_DATE_FORMATTER.format(date) : String(date);
}

/** ISO 8601 形式の日時文字列であれば日本時間（YYYY/MM/DD HH:mm:ss）に整形して返す */
export function tryFormatIsoDateTime(value: string): string {
  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  const date = new Date(value);
  return isValidDate(date) ? JAPAN_DATE_FORMATTER.format(date) : value;
}
