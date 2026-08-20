// src/renderer/features/spreadSheet/config/spreadsheetViewConfigs.ts

import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS, type AppViewId } from "@shared/types/uiType";
import { formatDateForHeader, getOffsetDate } from "@shared/utils/dateUtils";
import { SHEET_IDS, type SheetId } from "@shared/types/spreadsheetTypes";
import { SPREADSHEET_CONFIGS, type ColumnDef } from "./spreadsheetConfig";

const DATE_LABELS = {
  today: formatDateForHeader(new Date()),
  tomorrow: formatDateForHeader(getOffsetDate(1)),
} as const;

const buildHeaderGroupColumns = (rawColumns: readonly ColumnDef[]) =>
  rawColumns.map((col) => ({
    key: col.key,
    label: col.label,
    ...(col.width !== undefined && { width: col.width }),
    ...(col.group !== undefined && {
      headerGroup: { groupKey: col.group, label: DATE_LABELS[col.group] },
    }),
  }));

const createSpreadSheetViewConfig = (params: {
  id: AppViewId;
  title: string;
  order: number;
  sheetId: SheetId;
  placeholder?: string;
  searchKeys?: readonly string[];
  modalSize?: { width: string; height: string };
  modalType?: string;
  showSidebar?: boolean;
}): AppViewDefinition => {
  const rawCols = SPREADSHEET_CONFIGS[params.sheetId]?.columns ?? [];
  const columns =
    params.sheetId === SHEET_IDS.TANTOU
      ? rawCols
      : buildHeaderGroupColumns(rawCols);

  return {
    id: params.id,
    title: params.title,
    component: null,
    isProtected: true,
    sidebarMenu: { show: params.showSidebar ?? true, order: params.order },
    sheetId: params.sheetId,
    ...(params.placeholder && {
      search: {
        placeholder: params.placeholder,
        searchKeys: params.searchKeys ?? [],
      },
    }),
    modalConfig: {
      modalType: params.modalType ?? params.id,
      modalSize: params.modalSize ?? { width: "90vw", height: "85vh" },
    },
    columns,
  };
};

export const jugyoinViewConfig = createSpreadSheetViewConfig({
  id: APP_VIEW_IDS.JUGYOIN,
  title: "Jugyoin",
  order: 3,
  sheetId: SHEET_IDS.JUGYOIN,
  placeholder: "氏名や部署で検索...",
  searchKeys: ["name", "bumon", "naisen", "contactMobile"],
});

export const kokyuhyoViewConfig = createSpreadSheetViewConfig({
  id: APP_VIEW_IDS.KOKYUHYO,
  title: "Kokyuhyo",
  order: 2,
  sheetId: SHEET_IDS.KOKYUHYO,
  placeholder: "名前や内線番号で検索...",
  searchKeys: ["name", "naisen", "contactMobile"],
});

export const tantouViewConfig = createSpreadSheetViewConfig({
  id: APP_VIEW_IDS.TANTOU,
  title: "tantou",
  order: 99,
  sheetId: SHEET_IDS.TANTOU,
  showSidebar: false,
  modalType: "sheet_tantou",
  modalSize: { width: "60vw", height: "70vh" },
});

export const shopViewConfig = createSpreadSheetViewConfig({
  id: APP_VIEW_IDS.SHOP,
  title: "Shop",
  order: 4,
  sheetId: SHEET_IDS.SHOP,
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
  modalType: "sheet_shop",
  modalSize: { width: "80vw", height: "80vh" },
});
