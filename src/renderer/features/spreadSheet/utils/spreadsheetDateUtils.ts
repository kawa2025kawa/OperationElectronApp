// src/renderer/features/spreadsheet/utils/spreadsheetDateUtils.ts

import { addDays, format } from "date-fns";
import { ja } from "date-fns/locale/ja";

export const formatDateForHeader = (date: Date): string =>
  format(date, "MM/dd(EEE)", { locale: ja });

export const getOffsetDate = (offsetDays: number): Date =>
  addDays(new Date(), offsetDays);

export function getSpreadSheetDateLabels() {
  const now = new Date();
  return {
    today: `本日 (${formatDateForHeader(now)})`,
    tomorrow: `明日 (${formatDateForHeader(getOffsetDate(1))})`,
  } as const;
}

export const DATE_LABELS = getSpreadSheetDateLabels();
