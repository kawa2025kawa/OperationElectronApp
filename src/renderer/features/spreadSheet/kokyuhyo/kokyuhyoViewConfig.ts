// src/renderer/features/spreadSheet/kokyuhyo/kokyuhyoViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { KokyuhyoView } from "./KokyuhyoView";
import { KOKYUHYO_COLUMNS } from "./kokyuhyoColumns";

export const kokyuhyoViewConfig: AppViewDefinition<Kokyuhyo> = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "公休表",
  component: KokyuhyoView,
  isProtected: true,
  sidebarMenu: { show: true, order: 2 },
  sheetId: SHEETS.KOKYUHYO.sheetName,
  search: {
    placeholder: "名前、名前カナで検索...",
    searchKeys: ["name", "nameKana"],
  },
  columns: KOKYUHYO_COLUMNS,
};
