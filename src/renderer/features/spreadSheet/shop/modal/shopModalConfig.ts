// src/renderer/features/spreadSheet/shop/modal/shopModalConfig.ts

import type { Shop } from "@shared/types/spreadsheet/shop";
import { SHOP_FIELD_LABELS } from "@shared/types/spreadsheet/shop";
import type { TabGroupConfig } from "../../hooks/useSpreadSheetTabData";

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

export const SHOP_MODAL_GROUPS: readonly TabGroupConfig<keyof Shop>[] = [
  {
    title: "基本情報",
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
    title: "スタッフ",
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
    title: "プリンター (K)",
    items: [
      { key: "printerModelK", label: "機種名" },
      { key: "printerSerialNumberK", label: "シリアル" },
      { key: "printerPhoneK", label: "連絡先" },
      { key: "printerHolidayPhoneK", label: "休保" },
      { key: "printerContractIdK", label: "契約ID" },
    ],
  },
  {
    title: "プリンター (B)",
    items: [
      { key: "printerModelB", label: "機種名" },
      { key: "printerSerialNumberB", label: "シリアル" },
      { key: "printerPhoneB", label: "連絡先" },
      { key: "printerHolidayPhoneB", label: "休保" },
      { key: "printerContractIdB", label: "契約ID" },
    ],
  },
  {
    title: "プリンター (O)",
    items: [
      { key: "printerModelO", label: "機種名" },
      { key: "printerSerialNumberO", label: "シリアル" },
      { key: "printerPhoneO", label: "連絡先" },
      { key: "printerHolidayPhoneO", label: "土日祝連絡先" },
      { key: "printerContractIdO", label: "契約ID" },
    ],
  },
  {
    title: "タイムレコーダー",
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
