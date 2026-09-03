// src/renderer/features/spreadSheet/services/spreadsheetConfig.ts

import { SHEET_IDS, type SheetId } from "@shared/types/spreadsheet";

export interface SheetConfig {
  headerRow: number;
  dynamicRange: string;
  keyMap?: Record<string, string>;
}

const SPREADSHEET_CONFIGS: Record<SheetId, SheetConfig> = {
  [SHEET_IDS.SHOP]: {
    headerRow: 1,
    dynamicRange: "StoreMasterData!A1:BI10000",
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

      // Time Recorder
      tr1: "tr1",
      tr1Ip: "tr1Ip",
      tr1Model: "tr1Model",
      tr1LogicalPort: "tr1LogicalPort",
      tr1PhysicalPort: "tr1PhysicalPort",

      tr2: "tr2",
      tr2Ip: "tr2Ip",
      tr2Model: "tr2Model",
      tr2LogicalPort: "tr2LogicalPort",
      tr2PhysicalPort: "tr2PhysicalPort",

      tr3: "tr3",
      tr3Ip: "tr3Ip",
      tr3Model: "tr3Model",
      tr3LogicalPort: "tr3LogicalPort",
      tr3PhysicalPort: "tr3PhysicalPort",

      tr4: "tr4",
      tr4Ip: "tr4Ip",
      tr4Model: "tr4Model",
      tr4LogicalPort: "tr4LogicalPort",
      tr4PhysicalPort: "tr4PhysicalPort",

      remarks: "remarks",
      timeRecorder1: "timeRecorder1",
      timeRecorder2: "timeRecorder2",
      timeRecorder3: "timeRecorder3",
      timeRecorder4: "timeRecorder4",
      hub: "hub",
      powerOutlet: "powerOutlet",
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

/**
 * Sheet ID からスプレッドシート設定を取得
 */
export function getSheetRangeConfig(sheetId: SheetId): SheetConfig {
  return (
    SPREADSHEET_CONFIGS[sheetId] ?? {
      headerRow: 1,
      dynamicRange: `${sheetId}!A1:BI10000`,
    }
  );
}
