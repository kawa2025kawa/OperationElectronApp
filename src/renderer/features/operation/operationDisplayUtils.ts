// src/renderer/features/operation/operationDisplayUtils.ts

const INVALID_VALUE_SET = new Set(["", "-", "ー", "null", "undefined"]);

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function formatJapanDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

export function toDisplayValue(value: unknown): string {
  if (value == null) {
    return "-";
  }

  if (value instanceof Date) {
    return formatJapanDateTime(value);
  }

  const text = String(value).trim();

  if (INVALID_VALUE_SET.has(text)) {
    return "-";
  }

  if (ISO_DATE_TIME_PATTERN.test(text)) {
    const date = new Date(text);

    if (!Number.isNaN(date.getTime())) {
      return formatJapanDateTime(date);
    }
  }

  return text;
}
