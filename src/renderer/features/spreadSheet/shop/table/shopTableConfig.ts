// src/renderer/features/spreadSheet/shop/table/shopTableConfig.ts

import { createColumnHelper } from "@tanstack/react-table";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { SpreadSheetTableFeatures } from "@renderer/features/spreadSheet/components/table/spreadsheetTableConfig";

const columnHelper = createColumnHelper<SpreadSheetTableFeatures, Shop>();

export const SHOP_COLUMNS = columnHelper.columns([
  columnHelper.accessor("shopCode", {
    header: "店舗コード",
    size: 10,
  }),
  columnHelper.accessor("shopName", {
    header: "店舗名",
    size: 20,
  }),
  columnHelper.accessor("phoneNumber", {
    header: "電話番号",
    size: 15,
  }),
  columnHelper.accessor("postalCode", {
    header: "郵便番号",
    size: 15,
  }),
  columnHelper.accessor("address", {
    header: "住所",
    size: 40,
  }),
]);
