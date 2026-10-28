// src/renderer/features/spreadSheet/utils/spreadsheetDateUtils.ts

import { addDays, format, getDay } from "date-fns";
import { ja } from "date-fns/locale/ja";

export const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

export const getOffsetDate = (
  offsetDays: number,
  baseDate: Date = new Date(),
): Date => addDays(baseDate, offsetDays);

export function formatDateWithDay(date: Date) {
  const dayNum = getDay(date);
  const dayColor =
    dayNum === 6 ? "#0077ff" : dayNum === 0 ? "#ff3333" : "inherit";

  return {
    text: format(date, "MM/dd"),
    dayText: `(${format(date, "EEE", { locale: ja })})`,
    dayStyle: { color: dayColor },
  };
}

export function getSpreadSheetDateLabels() {
  const now = new Date();

  return {
    today: `本日 (${formatDateForHeader(now)})`,
    tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1, now))})`,
  } as const;
}

export const DATE_LABELS = getSpreadSheetDateLabels();
