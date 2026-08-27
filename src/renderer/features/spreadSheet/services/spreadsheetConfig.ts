// src/renderer/features/spreadSheet/services/spreadsheetConfig.ts

import { SHEET_IDS, type SheetId } from "@shared/types/spreadsheetTypes";

export interface SheetConfig {
  headerRow: number;
  dynamicRange: string;
  keyMap?: Record<string, string>;
}

const SPREADSHEET_CONFIGS: Record<SheetId, SheetConfig> = {
  [SHEET_IDS.SHOP]: {
    headerRow: 1,
    dynamicRange: "StoreMasterData!A1:AE10000",
    keyMap: {
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
    },
  },
  [SHEET_IDS.TANTOU]: {
    headerRow: 2,
    dynamicRange: "KokyuhyoTantouMasterData!A2:J10000",
  },
  [SHEET_IDS.KOKYUHYO]: {
    headerRow: 3,
    dynamicRange: "KokyuhyoMasterData!A3:M10000",
    keyMap: {
      todayAmStatus: "today.amStatus",
      todayAmDetail: "today.amDetail",
      todayPmStatus: "today.pmStatus",
      todayPmDetail: "today.pmDetail",
      AM2: "tomorrow.amStatus",
      AM2詳細: "tomorrow.amDetail",
      PM2: "tomorrow.pmStatus",
      PM2詳細: "tomorrow.pmDetail",
      tomorrowAmStatus: "tomorrow.amStatus",
      tomorrowAmDetail: "tomorrow.amDetail",
      tomorrowPmStatus: "tomorrow.pmStatus",
      tomorrowPmDetail: "tomorrow.pmDetail",
      naisen: "contact.extension",
      tanshuku: "contact.mobileShort",
      contactMobile: "contact.mobile",
    },
  },
  [SHEET_IDS.JUGYOIN]: {
    headerRow: 3,
    dynamicRange: "JugyoinMasterData!A3:N10000",
    keyMap: {
      bumon: "department",
      todayAmStatus: "today.amStatus",
      todayAmDetail: "today.amDetail",
      todayPmStatus: "today.pmStatus",
      todayPmDetail: "today.pmDetail",
      AM2: "tomorrow.amStatus",
      AM2詳細: "tomorrow.amDetail",
      PM2: "tomorrow.pmStatus",
      PM2詳細: "tomorrow.pmDetail",
      tomorrowAmStatus: "tomorrow.amStatus",
      tomorrowAmDetail: "tomorrow.amDetail",
      tomorrowPmStatus: "tomorrow.pmStatus",
      tomorrowPmDetail: "tomorrow.pmDetail",
      naisen: "contact.extension",
      tanshuku: "contact.mobileShort",
      contactMobile: "contact.mobile",
    },
  },
} as const;

/** 設定に存在する全SheetIdのリスト */
export const ALL_SHEET_IDS: readonly SheetId[] = Object.keys(
  SPREADSHEET_CONFIGS,
) as SheetId[];

export function getSheetRangeConfig(sheetId: SheetId): SheetConfig {
  return (
    SPREADSHEET_CONFIGS[sheetId] ?? {
      headerRow: 1,
      dynamicRange: `${sheetId}!1:10000`,
    }
  );
}
