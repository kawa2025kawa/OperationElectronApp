// src/renderer/features/spreadSheet/shop/shopViewConfig.ts

import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { ShopView } from "./ShopView";
import { SHOP_COLUMNS } from "./shopColumns";

export const shopViewConfig: AppViewDefinition<Shop> = {
  id: APP_VIEW_IDS.SHOP,
  title: "店舗情報",
  component: ShopView,
  isProtected: true,
  sidebarMenu: { show: true, order: 4 },
  sheetId: SHEETS.STORE.sheetName,
  search: {
    placeholder: "店舗コード、店舗名、住所等で検索...",
    searchKeys: [
      "shopCode",
      "shopName",
      "shopKana",
      "address",
      "phoneNumber",
      "centerName",
    ],
  },
  columns: SHOP_COLUMNS,
};
