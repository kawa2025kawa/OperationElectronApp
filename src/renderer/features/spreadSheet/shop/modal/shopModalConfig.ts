// src/renderer/features/spreadSheet/shop/modal/shopModalConfig.ts

import type {
  PublicShop,
  ShopResourceKey,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { SHOP_FIELD_LABELS } from "./shopFieldLabels";
import type { TabGroupConfig } from "../../hooks/useSpreadSheetTabData";

type PublicShopFieldKey = Exclude<keyof PublicShop, "availableResources">;

export const SHOP_MODAL_CONSTANTS = {
  TAB_TITLES: {
    BASIC: "基本情報",
    STAFF: "人員/エリア",
    PRINTER_K: "プリンター (K)",
    PRINTER_B: "プリンター (B)",
    PRINTER_O: "プリンター (O)",
    TIME_RECORDER: "タイムレコーダー",
  },
  TR_HEADER_BADGE: "TR",
  FILES: {
    EXCEL_LABEL: "完成図書.xlsx",
    PDF_LABEL: "完成図書.pdf",
  },
} as const;

export const TERMINAL_TYPES = ["tr1", "tr2", "tr3", "tr4"] as const;

export const TERMINAL_FIELDS = [
  { suffix: "Name", label: "機器名" },
  { suffix: "Ip", label: "IP" },
  { suffix: "Model", label: "型番" },
  { suffix: "LogicalName", label: "論理" },
  { suffix: "PhysicalName", label: "物理" },
] as const;

export const TIME_RECORDER_IMAGE_ITEMS: readonly {
  key: ShopResourceKey;
  label: string;
}[] = [
  ...TERMINAL_TYPES.map((tr) => ({
    key: `${tr}ImageUrl` as ShopResourceKey,
    label: SHOP_FIELD_LABELS[`${tr}ImageUrl`],
  })),
  { key: "hubImageUrl", label: SHOP_FIELD_LABELS.hubImageUrl },
  { key: "outletImageUrl", label: SHOP_FIELD_LABELS.outletImageUrl },
];

const createPrinterGroup = (
  title: string,
  type: "K" | "B" | "O",
): TabGroupConfig<PublicShopFieldKey> => ({
  title,
  items: [
    { key: `printerModel${type}`, label: "機種名" },
    { key: `printerSerialNumber${type}`, label: "シリアル" },
    { key: `printerPhone${type}`, label: "連絡先" },
    { key: `printerHolidayPhone${type}`, label: "休日連絡先" },
    { key: `printerContractId${type}`, label: "土日祝契約ID" },
  ],
});

const createFieldItems = (keys: readonly PublicShopFieldKey[]) =>
  keys.map((key) => ({ key, label: SHOP_FIELD_LABELS[key] }));

export const SHOP_MODAL_GROUPS: readonly TabGroupConfig<PublicShopFieldKey>[] =
  [
    {
      title: SHOP_MODAL_CONSTANTS.TAB_TITLES.BASIC,
      items: createFieldItems([
        "openTime",
        "closeTime",
        "phoneNumber",
        "postalCode",
        "address",
        "mobileSales",
      ]),
    },
    {
      title: SHOP_MODAL_CONSTANTS.TAB_TITLES.STAFF,
      items: createFieldItems([
        "storeManagerName",
        "assistantManagerName1",
        "assistantManagerName2",
        "areaManagerName",
        "areaName",
        "centerName",
      ]),
    },
    createPrinterGroup(SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_K, "K"),
    createPrinterGroup(SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_B, "B"),
    createPrinterGroup(SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_O, "O"),
    {
      title: SHOP_MODAL_CONSTANTS.TAB_TITLES.TIME_RECORDER,
      items: createFieldItems([
        "deviceCount",
        ...TERMINAL_TYPES.flatMap((tr) =>
          TERMINAL_FIELDS.map(
            ({ suffix }) => `${tr}${suffix}` as PublicShopFieldKey,
          ),
        ),
        "comment",
      ]),
    },
  ];