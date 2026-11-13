// src/renderer/features/spreadSheet/kokyuhyo/table/kokyuhyoTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Kokyuhyo } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  createScheduleDayGroups,
  type SpreadSheetTableFeatures,
} from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Kokyuhyo>();

export function getKokyuhyoColumns() {
  return columnHelper.columns([
    columnHelper.accessor("name", {
      header: "氏名",
      size: 20,
    }),
    ...createScheduleDayGroups<Kokyuhyo>({ status: 8, detail: 12 }),
  ]);
}
