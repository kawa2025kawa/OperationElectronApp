// src/renderer/features/spreadSheet/jugyoin/table/jugyoinTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Jugyoin } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  createScheduleDayGroups,
  type SpreadSheetTableFeatures,
} from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Jugyoin>();

export function getJugyoinColumns() {
  return columnHelper.columns([
    columnHelper.accessor("bumon", {
      header: "部門",
      size: 15,
    }),
    columnHelper.accessor("name", {
      header: "氏名",
      size: 15,
    }),
    ...createScheduleDayGroups<Jugyoin>({ status: 7, detail: 10.5 }),
  ]);
}
