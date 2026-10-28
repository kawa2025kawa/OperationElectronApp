// src/renderer/features/spreadSheet/jugyoin/jugyoinViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { JugyoinView } from "./JugyoinView";
import { JUGYOIN_COLUMNS } from "./jugyoinColumns";

export const jugyoinViewConfig: AppViewDefinition<Jugyoin> = {
  id: APP_VIEW_IDS.JUGYOIN,
  title: "従業員情報",
  component: JugyoinView,
  isProtected: true,
  sidebarMenu: { show: true, order: 3 },
  sheetId: SHEETS.JUGYOIN.sheetName,
  search: {
    placeholder: "部門、名前で検索...",
    searchKeys: ["bumon", "bumonKana", "name", "nameKana"],
  },
  columns: JUGYOIN_COLUMNS,
};
