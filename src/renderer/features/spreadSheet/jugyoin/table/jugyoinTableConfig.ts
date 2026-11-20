// src/renderer/features/spreadSheet/jugyoin/table/jugyoinTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Jugyoin } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  createScheduleDayGroups,
  type SpreadSheetTableFeatures,
} from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Jugyoin>();

export function getJugyoinRowId(row: Jugyoin, index: number): string {
  return row.id
    ? `${row.id}_${index}`
    : `${row.name ? String(row.name).trim() : "jugyoin"}_${index}`;
}

export function getJugyoinColumns(baseDate?: Date) {
  return columnHelper.columns([
    columnHelper.accessor("bumon", {
      header: "部門",
      size: 12,
    }),
    columnHelper.accessor("name", {
      header: "氏名",
      size: 10,
    }),
    ...createScheduleDayGroups<Jugyoin>({ status: 5, detail: 10.5 }, baseDate),
  ]);
}
