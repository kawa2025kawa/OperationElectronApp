import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Column } from "@shared/types/table/tableType";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "shopCode", label: "店舗コード", width: "10%" },
  { key: "shopName", label: "店舗名", width: "20%" },
  { key: "phoneNumber", label: "電話番号", width: "15%" },
  { key: "postalCode", label: "郵便番号", width: "15%" },
  { key: "address", label: "住所", width: "40%" },
] as const;

export const shopViewConfig: AppViewDefinition<Shop> = {
  id: APP_VIEW_IDS.SHOP,
  title: "店舗情報",
  component: null,
  isProtected: true,
  sidebarMenu: {
    show: true,
    order: 4,
  },
  sheetId: "StoreMasterData",
  search: {
    placeholder: "店舗検索...",
    searchKeys: [
      "shopCode",
      "shopName",
      "shopKana",
      "address",
      "phoneNumber",
      "centerName",
    ],
  },
  modalConfig: {
    modalType: "sheet_shop",
    modalSize: {
      width: "80vw",
      height: "80vh",
    },
  },
  columns: SHOP_COLUMNS,
};
