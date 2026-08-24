// src/renderer/features/spreadSheet/components/modal/shop/useShopModalContent.ts

import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import type { Column } from "@shared/types/tableType";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheetTypes";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import {
  useSpreadSheetTabData,
  type TabGroupConfig,
} from "../hooks/useSpreadSheetTabData";

// ----------------------------------------------------------------------------
// 1. API Range & Key Mapping Config
// ----------------------------------------------------------------------------

export const SHOP_RANGE_CONFIG = {
  tabName: "StoreMasterData",
  headerRow: 1,
  startColumn: "A",
  endColumn: "AE",
  dynamicRange: "StoreMasterData!A1:AE10000",
} as const;

export const SHOP_KEY_MAP = {
  shopCode: "code",
  shopName: "name",
  shopKana: "nameKana",
  openTime: "businessHoursStart",
  closeTime: "businessHoursEnd",
  idoHanbai: "idoHanbai",
  subManager1: "subManagerName1",
  subManager2: "subManagerName2",
  areaName: "area",
  printerModelB: "printerB.model",
  printerSerialB: "printerB.serial",
  printerCallB: "printerB.callTarget",
  printerHolidayB: "printerB.weekendSupport",
  printerContractIdB: "printerB.contractId",
  printerModelK: "printerK.model",
  printerSerialK: "printerK.serial",
  printerCallK: "printerK.callTarget",
  printerHolidayK: "printerK.weekendSupport",
  printerContractIdK: "printerK.contractId",
  printerModelO: "printerO.model",
  printerSerialO: "printerO.serial",
  printerCallO: "printerO.callTarget",
  printerHolidayO: "printerO.weekendSupport",
  printerContractIdO: "printerO.contractId",
} as const;

// ----------------------------------------------------------------------------
// 2. Table Columns & App View Definition
// ----------------------------------------------------------------------------

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "code", label: "店番", width: "10%" },
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
  columns: SHOP_COLUMNS as readonly Column<unknown>[],
};

// ----------------------------------------------------------------------------
// 3. Modal Fields & Logic
// ----------------------------------------------------------------------------

const PRINTER_FIELDS = [
  { subKey: "model", label: "型番" },
  { subKey: "serial", label: "シリアル" },
  { subKey: "callTarget", label: "連絡先" },
  { subKey: "weekendSupport", label: "土日対応" },
  { subKey: "contractId", label: "契約ID" },
] as const;

const createPrinterGroup = (type: "K" | "B" | "O"): TabGroupConfig => ({
  title: `プリンター (${type})`,
  items: PRINTER_FIELDS.map(({ subKey, label }) => ({
    key: `printer${type}.${subKey}`,
    label: `${type} ${label}`,
  })),
});

const SHOP_MODAL_GROUPS: readonly TabGroupConfig[] = [
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
    title: "役職",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "センター" },
    ],
  },
  createPrinterGroup("K"),
  createPrinterGroup("B"),
  createPrinterGroup("O"),
] as const;

export function useShopModalContent(data: Shop) {
  return useSpreadSheetTabData(
    data as unknown as Record<string, unknown>,
    SHOP_MODAL_GROUPS,
  );
}
