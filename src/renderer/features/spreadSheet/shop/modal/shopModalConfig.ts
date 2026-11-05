// src/renderer/features/spreadSheet/shop/modal/shopModalConfig.ts

import type { Shop } from "@shared/types/spreadsheet/shop";
import { SHOP_FIELD_LABELS } from "@shared/types/spreadsheet/shop";
import type { TabGroupConfig } from "../../hooks/useSpreadSheetTabData";
import { EMPTY_VALUE_FALLBACK } from "@shared/types/spreadsheet/spreadsheetTypes";

export { EMPTY_VALUE_FALLBACK };

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
  key: keyof Shop;
  label: string;
}[] = [
  { key: "tr1ImageUrl", label: SHOP_FIELD_LABELS.tr1ImageUrl },
  { key: "tr2ImageUrl", label: SHOP_FIELD_LABELS.tr2ImageUrl },
  { key: "tr3ImageUrl", label: SHOP_FIELD_LABELS.tr3ImageUrl },
  { key: "tr4ImageUrl", label: SHOP_FIELD_LABELS.tr4ImageUrl },
  { key: "hubImageUrl", label: SHOP_FIELD_LABELS.hubImageUrl },
  { key: "outletImageUrl", label: SHOP_FIELD_LABELS.outletImageUrl },
] as const;

const PRINTER_FIELD_LABELS = {
  MODEL: "機種名",
  SERIAL: "シリアル",
  PHONE: "連絡先",
  HOLIDAY_PHONE: "休日連絡先",
  CONTRACT_ID: "土日祝契約ID",
} as const;

export const SHOP_MODAL_GROUPS: readonly TabGroupConfig<keyof Shop>[] = [
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.BASIC,
    items: [
      { key: "openTime", label: SHOP_FIELD_LABELS.openTime },
      { key: "closeTime", label: SHOP_FIELD_LABELS.closeTime },
      { key: "phoneNumber", label: SHOP_FIELD_LABELS.phoneNumber },
      { key: "postalCode", label: SHOP_FIELD_LABELS.postalCode },
      { key: "address", label: SHOP_FIELD_LABELS.address },
      { key: "mobileSales", label: SHOP_FIELD_LABELS.mobileSales },
    ],
  },
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.STAFF,
    items: [
      { key: "storeManagerName", label: SHOP_FIELD_LABELS.storeManagerName },
      {
        key: "assistantManagerName1",
        label: SHOP_FIELD_LABELS.assistantManagerName1,
      },
      {
        key: "assistantManagerName2",
        label: SHOP_FIELD_LABELS.assistantManagerName2,
      },
      { key: "areaManagerName", label: SHOP_FIELD_LABELS.areaManagerName },
      { key: "areaName", label: SHOP_FIELD_LABELS.areaName },
      { key: "centerName", label: SHOP_FIELD_LABELS.centerName },
    ],
  },
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_K,
    items: [
      { key: "printerModelK", label: PRINTER_FIELD_LABELS.MODEL },
      { key: "printerSerialNumberK", label: PRINTER_FIELD_LABELS.SERIAL },
      { key: "printerPhoneK", label: PRINTER_FIELD_LABELS.PHONE },
      {
        key: "printerHolidayPhoneK",
        label: PRINTER_FIELD_LABELS.HOLIDAY_PHONE,
      },
      { key: "printerContractIdK", label: PRINTER_FIELD_LABELS.CONTRACT_ID },
    ],
  },
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_B,
    items: [
      { key: "printerModelB", label: PRINTER_FIELD_LABELS.MODEL },
      { key: "printerSerialNumberB", label: PRINTER_FIELD_LABELS.SERIAL },
      { key: "printerPhoneB", label: PRINTER_FIELD_LABELS.PHONE },
      {
        key: "printerHolidayPhoneB",
        label: PRINTER_FIELD_LABELS.HOLIDAY_PHONE,
      },
      { key: "printerContractIdB", label: PRINTER_FIELD_LABELS.CONTRACT_ID },
    ],
  },
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.PRINTER_O,
    items: [
      { key: "printerModelO", label: PRINTER_FIELD_LABELS.MODEL },
      { key: "printerSerialNumberO", label: PRINTER_FIELD_LABELS.SERIAL },
      { key: "printerPhoneO", label: PRINTER_FIELD_LABELS.PHONE },
      {
        key: "printerHolidayPhoneO",
        label: PRINTER_FIELD_LABELS.HOLIDAY_PHONE,
      },
      { key: "printerContractIdO", label: PRINTER_FIELD_LABELS.CONTRACT_ID },
    ],
  },
  {
    title: SHOP_MODAL_CONSTANTS.TAB_TITLES.TIME_RECORDER,
    items: [
      { key: "deviceCount", label: SHOP_FIELD_LABELS.deviceCount },
      { key: "tr1Name", label: SHOP_FIELD_LABELS.tr1Name },
      { key: "tr1Ip", label: SHOP_FIELD_LABELS.tr1Ip },
      { key: "tr1Model", label: SHOP_FIELD_LABELS.tr1Model },
      { key: "tr1LogicalName", label: SHOP_FIELD_LABELS.tr1LogicalName },
      { key: "tr1PhysicalName", label: SHOP_FIELD_LABELS.tr1PhysicalName },
      { key: "tr2Name", label: SHOP_FIELD_LABELS.tr2Name },
      { key: "tr2Ip", label: SHOP_FIELD_LABELS.tr2Ip },
      { key: "tr2Model", label: SHOP_FIELD_LABELS.tr2Model },
      { key: "tr2LogicalName", label: SHOP_FIELD_LABELS.tr2LogicalName },
      { key: "tr2PhysicalName", label: SHOP_FIELD_LABELS.tr2PhysicalName },
      { key: "tr3Name", label: SHOP_FIELD_LABELS.tr3Name },
      { key: "tr3Ip", label: SHOP_FIELD_LABELS.tr3Ip },
      { key: "tr3Model", label: SHOP_FIELD_LABELS.tr3Model },
      { key: "tr3LogicalName", label: SHOP_FIELD_LABELS.tr3LogicalName },
      { key: "tr3PhysicalName", label: SHOP_FIELD_LABELS.tr3PhysicalName },
      { key: "tr4Name", label: SHOP_FIELD_LABELS.tr4Name },
      { key: "tr4Ip", label: SHOP_FIELD_LABELS.tr4Ip },
      { key: "tr4Model", label: SHOP_FIELD_LABELS.tr4Model },
      { key: "tr4LogicalName", label: SHOP_FIELD_LABELS.tr4LogicalName },
      { key: "tr4PhysicalName", label: SHOP_FIELD_LABELS.tr4PhysicalName },
      { key: "comment", label: SHOP_FIELD_LABELS.comment },
    ],
  },
] as const;
