// src/renderer/features/spreadSheet/components/modal/shop/constants.ts

import type { Shop } from "@shared/types/spreadsheet/shop";
import { SHOP_FIELD_LABELS } from "@shared/types/spreadsheet/shop";
import type { TabGroupConfig } from "@renderer/features/spreadSheet/components/modal/hooks/useSpreadSheetTabData";

export const TERMINAL_TYPES = ["tr1", "tr2", "tr3", "tr4"] as const;

export const TERMINAL_FIELDS = [
  { suffix: "", label: "端末名" },
  { suffix: "Ip", label: "IP" },
  { suffix: "Model", label: "型番" },
  { suffix: "Ronri", label: "論理" },
  { suffix: "Butsuri", label: "物理" },
] as const;

export const TIME_RECORDER_IMAGE_ITEMS: readonly {
  key: keyof Shop;
  label: string;
}[] = [
  { key: "tr1ImageUrl", label: SHOP_FIELD_LABELS.tr1ImageUrl },
  { key: "tr2ImageUrl", label: SHOP_FIELD_LABELS.tr2ImageUrl },
  { key: "tr3ImageUrl", label: SHOP_FIELD_LABELS.tr3ImageUrl },
  { key: "tr4ImageUrl", label: SHOP_FIELD_LABELS.tr4ImageUrl },
  { key: "hub", label: SHOP_FIELD_LABELS.hub },
  { key: "outlet", label: SHOP_FIELD_LABELS.outlet },
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
    title: "担当者",
    items: [
      { key: "tencyoName", label: SHOP_FIELD_LABELS.tencyoName },
      { key: "hukuTencyoName1", label: SHOP_FIELD_LABELS.hukuTencyoName1 },
      { key: "hukuTencyoName2", label: SHOP_FIELD_LABELS.hukuTencyoName2 },
      { key: "managerName", label: SHOP_FIELD_LABELS.managerName },
      { key: "areaName", label: SHOP_FIELD_LABELS.areaName },
      { key: "centerName", label: SHOP_FIELD_LABELS.centerName },
    ],
  },
  {
    title: "プリンタ (K)",
    items: [
      { key: "printerModelK", label: SHOP_FIELD_LABELS.printerModelK },
      { key: "printerSerialK", label: SHOP_FIELD_LABELS.printerSerialK },
      { key: "printerCallK", label: SHOP_FIELD_LABELS.printerCallK },
      { key: "printerHolidayK", label: SHOP_FIELD_LABELS.printerHolidayK },
      {
        key: "printerContractIdK",
        label: SHOP_FIELD_LABELS.printerContractIdK,
      },
    ],
  },
  {
    title: "プリンタ (B)",
    items: [
      { key: "printerModelB", label: SHOP_FIELD_LABELS.printerModelB },
      { key: "printerSerialB", label: SHOP_FIELD_LABELS.printerSerialB },
      { key: "printerCallB", label: SHOP_FIELD_LABELS.printerCallB },
      { key: "printerHolidayB", label: SHOP_FIELD_LABELS.printerHolidayB },
      {
        key: "printerContractIdB",
        label: SHOP_FIELD_LABELS.printerContractIdB,
      },
    ],
  },
  {
    title: "プリンタ (O)",
    items: [
      { key: "printerModelO", label: SHOP_FIELD_LABELS.printerModelO },
      { key: "printerSerialO", label: SHOP_FIELD_LABELS.printerSerialO },
      { key: "printerCallO", label: SHOP_FIELD_LABELS.printerCallO },
      { key: "printerHolidayO", label: SHOP_FIELD_LABELS.printerHolidayO },
      {
        key: "printerContractIdO",
        label: SHOP_FIELD_LABELS.printerContractIdO,
      },
    ],
  },
  {
    title: "タイムレコーダ",
    items: [
      { key: "deviceCount", label: SHOP_FIELD_LABELS.deviceCount },
      { key: "tr1", label: SHOP_FIELD_LABELS.tr1 },
      { key: "tr1Ip", label: SHOP_FIELD_LABELS.tr1Ip },
      { key: "tr1Model", label: SHOP_FIELD_LABELS.tr1Model },
      { key: "tr1Ronri", label: SHOP_FIELD_LABELS.tr1Ronri },
      { key: "tr1Butsuri", label: SHOP_FIELD_LABELS.tr1Butsuri },
      { key: "tr2", label: SHOP_FIELD_LABELS.tr2 },
      { key: "tr2Ip", label: SHOP_FIELD_LABELS.tr2Ip },
      { key: "tr2Model", label: SHOP_FIELD_LABELS.tr2Model },
      { key: "tr2Ronri", label: SHOP_FIELD_LABELS.tr2Ronri },
      { key: "tr2Butsuri", label: SHOP_FIELD_LABELS.tr2Butsuri },
      { key: "tr3", label: SHOP_FIELD_LABELS.tr3 },
      { key: "tr3Ip", label: SHOP_FIELD_LABELS.tr3Ip },
      { key: "tr3Model", label: SHOP_FIELD_LABELS.tr3Model },
      { key: "tr3Ronri", label: SHOP_FIELD_LABELS.tr3Ronri },
      { key: "tr3Butsuri", label: SHOP_FIELD_LABELS.tr3Butsuri },
      { key: "tr4", label: SHOP_FIELD_LABELS.tr4 },
      { key: "tr4Ip", label: SHOP_FIELD_LABELS.tr4Ip },
      { key: "tr4Model", label: SHOP_FIELD_LABELS.tr4Model },
      { key: "tr4Ronri", label: SHOP_FIELD_LABELS.tr4Ronri },
      { key: "tr4Butsuri", label: SHOP_FIELD_LABELS.tr4Butsuri },
      { key: "comment", label: SHOP_FIELD_LABELS.comment },
    ],
  },
] as const;
