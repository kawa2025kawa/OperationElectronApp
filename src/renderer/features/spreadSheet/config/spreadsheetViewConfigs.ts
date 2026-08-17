import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheetTypes";
import { SPREADSHEET_CONFIGS } from "./spreadsheetConfig";

// -------------------------------------------------------------
// 共通ヘルパー: 日付ラベル生成 (Jugyoin / Kokyuhyo で共通利用)
// -------------------------------------------------------------
const dateLabels = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
};

// -------------------------------------------------------------
// 1. 従業員 (Jugyoin) View Config
// -------------------------------------------------------------
const jugyoinColumns = SPREADSHEET_CONFIGS[SHEET_IDS.JUGYOIN].columns.map(
  (col) => ({
    key: col.key,
    label: col.label,
    ...(col.width !== undefined && { width: col.width }),
    ...(col.group !== undefined && {
      headerGroup: { groupKey: col.group, label: dateLabels[col.group] },
    }),
  }),
);

export const jugyoinViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.JUGYOIN,
  title: "Jugyoin",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 3 },
  sheetId: SHEET_IDS.JUGYOIN,
  search: {
    placeholder: "氏名や部署で検索...",
    searchKeys: ["name", "bumon", "naisen", "contactMobile"],
  },
  modalConfig: {
    modalType: APP_VIEW_IDS.JUGYOIN,
    modalSize: { width: "90vw", height: "85vh" },
  },
  columns: jugyoinColumns,
};

// -------------------------------------------------------------
// 2. 局休表 (Kokyuhyo) View Config
// -------------------------------------------------------------
const kokyuhyoColumns = SPREADSHEET_CONFIGS[SHEET_IDS.KOKYUHYO].columns.map(
  (col) => ({
    key: col.key,
    label: col.label,
    ...(col.width !== undefined && { width: col.width }),
    ...(col.group !== undefined && {
      headerGroup: { groupKey: col.group, label: dateLabels[col.group] },
    }),
  }),
);

export const kokyuhyoViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "Kokyuhyo",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 2 },
  sheetId: SHEET_IDS.KOKYUHYO,
  search: {
    placeholder: "名前や内線番号で検索...",
    searchKeys: ["name", "naisen", "contactMobile"],
  },
  modalConfig: {
    modalType: APP_VIEW_IDS.KOKYUHYO,
    modalSize: { width: "90vw", height: "85vh" },
  },
  columns: kokyuhyoColumns,
};

// -------------------------------------------------------------
// 3. 担当 (Tantou) View Config
// -------------------------------------------------------------
export const tantouViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.TANTOU,
  title: "tantou",
  component: null,
  isProtected: true,
  sidebarMenu: { show: false, order: 99 },
  sheetId: SHEET_IDS.TANTOU,
  modalConfig: {
    modalType: "sheet_tantou",
    modalSize: { width: "60vw", height: "70vh" },
  },
  columns: SPREADSHEET_CONFIGS[SHEET_IDS.TANTOU].columns,
};

// -------------------------------------------------------------
// 4. 店舗 (Shop) View Config
// -------------------------------------------------------------
export interface ModalFieldItem {
  key: keyof Shop | string;
  label: string;
}

export interface ModalGroupDef {
  title: string;
  items: ModalFieldItem[];
}

const shopModalGroups: ModalGroupDef[] = [
  {
    title: "基本情報",
    items: [
      { key: "businessHours", label: "営業時間" },
      { key: "phoneNumber", label: "電話番号" },
      { key: "idoHanbai", label: "移動販売" },
      { key: "address", label: "住所" },
    ],
  },
  {
    title: "管理者情報",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "subManagerName2", label: "副店長2" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "担当センター" },
    ],
  },
  {
    title: "プリンター(K)",
    items: [
      { key: "printerK.model", label: "K機種" },
      { key: "printerK.serial", label: "Kシリアル" },
      { key: "printerK.callTarget", label: "Kコール先" },
      { key: "printerK.weekendSupport", label: "K土日対応" },
      { key: "printerK.contractId", label: "K契約ID" },
    ],
  },
  {
    title: "プリンター(B)",
    items: [
      { key: "printerB.model", label: "B機種" },
      { key: "printerB.serial", label: "Bシリアル" },
      { key: "printerB.callTarget", label: "Bコール先" },
      { key: "printerB.weekendSupport", label: "B土日対応" },
      { key: "printerB.contractId", label: "B契約ID" },
    ],
  },
  {
    title: "プリンター(O)",
    items: [
      { key: "printerO.model", label: "O機種" },
      { key: "printerO.serial", label: "Oシリアル" },
      { key: "printerO.callTarget", label: "Oコール先" },
      { key: "printerO.weekendSupport", label: "O土日対応" },
      { key: "printerO.contractId", label: "O契約ID" },
    ],
  },
];

export const shopViewConfig = {
  id: APP_VIEW_IDS.SHOP,
  title: "Shop",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 4 },
  sheetId: SHEET_IDS.SHOP,
  search: {
    placeholder: "コード・店名・住所・店長名で検索...",
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
  columns: SPREADSHEET_CONFIGS[SHEET_IDS.SHOP].columns,
  modalGroups: shopModalGroups,
} as const satisfies AppViewDefinition & { modalGroups: ModalGroupDef[] };
