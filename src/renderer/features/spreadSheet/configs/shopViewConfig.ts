import type { AppViewDefinition } from "@shared/types/registry";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheet";
import type { Column } from "@shared/types/table";
import { APP_VIEW_IDS } from "@shared/types/ui";

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "code", label: "店舗コード", width: "10%" },
  { key: "name", label: "店舗名", width: "20%" },
  { key: "contact.phoneNumber", label: "電話番号", width: "15%" },
  { key: "contact.postalCode", label: "郵便番号", width: "15%" },
  { key: "location.address", label: "住所", width: "40%" },
] as const;

export const shopViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.SHOP,
  title: "店舗情報",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 4 },
  sheetId: SHEET_IDS.SHOP,
  search: {
    placeholder: "店舗検索...",
    searchKeys: [
      "code",
      "name",
      "nameKana",
      "location.address",
      "managers.manager",
      "contact.phoneNumber",
      "location.centerName",
    ],
  },
  modalConfig: {
    modalType: "sheet_shop",
    modalSize: { width: "80vw", height: "80vh" },
  },
  columns: SHOP_COLUMNS as readonly Column<unknown>[],
};
