// src/renderer/features/spreadSheet/kokyuhyo/table/kokyuhyoTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Kokyuhyo } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  createScheduleDayGroups,
  type SpreadSheetTableFeatures,
} from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Kokyuhyo>();

const HOLIDAY_WORDS = ["公休", "有休", "〇連", "特休", "希休", "休"] as const;

export function isKokyuhyoHolidayText(value: unknown): boolean {
  const text = value == null ? "" : String(value);
  return HOLIDAY_WORDS.some((word) => text.includes(word));
}

export function getKokyuhyoRowId(row: Kokyuhyo, index: number): string {
  return row.id
    ? `${row.id}_${index}`
    : `${row.name ? String(row.name).trim() : "kokyuhyo"}_${index}`;
}

export function getKokyuhyoColumns() {
  return columnHelper.columns([
    columnHelper.accessor("name", {
      header: "氏名",
      size: 12,
    }),
    ...createScheduleDayGroups<Kokyuhyo>({ status: 8, detail: 12 }),
  ]);
}