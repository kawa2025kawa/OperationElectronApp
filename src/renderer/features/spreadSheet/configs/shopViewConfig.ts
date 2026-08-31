import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheetTypes";
import type { Column } from "@shared/types/tableType";
import { APP_VIEW_IDS } from "@shared/types/uiType";

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "code", label: "店舗コード", width: "10%" },
  { key: "name", label: "店舗名", width: "20%" },
  { key: "phoneNumber", label: "電話番号", width: "15%" },
  { key: "postalCode", label: "郵便番号", width: "15%" },
  { key: "address", label: "住所", width: "40%" },
] as const;

export const shopViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.SHOP,
  title: "Shop",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 4 },
  sheetId: SHEET_IDS.SHOP,
  search: {
    placeholder: "検索...",
    searchKeys: [
      "code",
      "name",
      "nameKana",
      "address",
      "managerName",
      "phoneNumber",
      "centerName",
    ],
  },
  modalConfig: {
    modalType: "sheet_shop",
    modalSize: { width: "80vw", height: "80vh" },
  },
  columns: SHOP_COLUMNS as readonly Column<unknown>[],
};