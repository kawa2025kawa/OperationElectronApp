// src/renderer/features/spreadSheet/shop/shopColumns.ts

import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Column } from "@shared/types/table/tableType";

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "shopCode", label: "店舗コード", width: "10%" },
  { key: "shopName", label: "店舗名", width: "20%" },
  { key: "phoneNumber", label: "電話番号", width: "15%" },
  { key: "postalCode", label: "郵便番号", width: "15%" },
  { key: "address", label: "住所", width: "40%" },
];
