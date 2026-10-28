// src/renderer/features/operation/operationDisplayUtils.ts

const MISSING_PROPERTY_VALUE = "‐";

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

function formatJapanDateTime(date: Date): string {
  return JAPAN_DATE_FORMATTER.format(date);
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/**
 * プロパティが存在しない場合の表示値を返す。
 */
export function toMissingPropertyDisplayValue(): string {
  return MISSING_PROPERTY_VALUE;
}

/**
 * 存在するプロパティの値を表示用文字列に変換する。
 * 値の欠損判定や文字列の正規化は行わない。
 */
export function toDisplayValue(value: unknown): string {
  if (value instanceof Date) {
    return isValidDate(value) ? formatJapanDateTime(value) : String(value);
  }

  if (typeof value === "string" && ISO_DATE_TIME_PATTERN.test(value)) {
    const date = new Date(value);

    return isValidDate(date) ? formatJapanDateTime(date) : value;
  }

  return String(value);
}
