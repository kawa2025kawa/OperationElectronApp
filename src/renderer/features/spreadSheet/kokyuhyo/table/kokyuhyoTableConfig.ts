// src/renderer/features/spreadSheet/kokyuhyo/table/kokyuhyoTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Kokyuhyo } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  createScheduleDayGroups,
  type SpreadSheetTableFeatures,
} from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Kokyuhyo>();

export function getKokyuhyoRowId(row: Kokyuhyo, index: number): string {
  return row.id
    ? `${row.id}_${index}`
    : `${row.name ? String(row.name).trim() : "kokyuhyo"}_${index}`;
}

export function getKokyuhyoColumns(baseDate?: Date) {
  return columnHelper.columns([
    columnHelper.accessor("name", {
      header: "氏名",
      size: 12,
    }),
    ...createScheduleDayGroups<Kokyuhyo>({ status: 5, detail: 12 }, baseDate),
  ]);
}
