// src/shared/utils/dateTimeUtils.ts

import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO } from "date-fns";

const JST_TIME_ZONE = "Asia/Tokyo" as const;
const JAPAN_DATE_TIME_FORMAT = "yyyy/MM/dd HH:mm:ss" as const;

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Date オブジェクトを日本時間（YYYY/MM/DD HH:mm:ss）に整形する */
export function formatJapanDateTime(date: Date): string {
  return isValid(date)
    ? format(new TZDate(date, JST_TIME_ZONE), JAPAN_DATE_TIME_FORMAT)
    : String(date);
}

/** ISO 8601 形式の日時文字列であれば日本時間（YYYY/MM/DD HH:mm:ss）に整形して返す */
export function tryFormatIsoDateTime(value: string): string {
  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  const date = parseISO(value);
  return isValid(date)
    ? format(new TZDate(date, JST_TIME_ZONE), JAPAN_DATE_TIME_FORMAT)
    : value;
}