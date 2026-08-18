import { SHEET_IDS, type SheetId } from "@shared/types/spreadsheetTypes";

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  group?: "today" | "tomorrow";
  headerGroup?: { groupKey: string; label: string }; // ⭕ 追加
}

export interface SheetDataConfig {
  /** 実際のGoogleスプレッドシートのタブ名 */
  tabName: string;
  /** ヘッダー（見出し行）が存在する行番号 (1始まり) */
  headerRow: number;
  /** 読み取り開始列 */
  startColumn: string;
  /** 読み取り終了列 */
  endColumn: string;
  /** キー変換マッピング (生列名 -> ネストプロパティパス) */
  keyMap?: Record<string, string>;
  /** UIテーブル表示用カラム定義 */
  columns: ColumnDef[];
}

export interface KeyMappingDefinition {
  /** スプレッドシート上の生カラム名 */
  rawHeader: string;
  /** システム内で扱うオブジェクトパス (例: today.amDetail) */
  targetPath: string;
}

/* ============================================================================
 * 1. 全シート共通の固有キーマッピングの一元管理定義マスター
 * ============================================================================ */
export const SHEET_KEY_MASTER = {
  // 共通スケジュール項目
  SCHEDULE: {
    TODAY_AM_STATUS: {
      rawHeader: "todayAmStatus",
      targetPath: "today.amStatus",
    },
    TODAY_AM_DETAIL: {
      rawHeader: "todayAmDetail",
      targetPath: "today.amDetail",
    },
    TODAY_PM_STATUS: {
      rawHeader: "todayPmStatus",
      targetPath: "today.pmStatus",
    },
    TODAY_PM_DETAIL: {
      rawHeader: "todayPmDetail",
      targetPath: "today.pmDetail",
    },

    // Kokyuhyo 用の明日分表記
    KOKYUHYO_TOMORROW_AM_STATUS: {
      rawHeader: "AM2",
      targetPath: "tomorrow.amStatus",
    },
    KOKYUHYO_TOMORROW_AM_DETAIL: {
      rawHeader: "AM2詳細",
      targetPath: "tomorrow.amDetail",
    },
    KOKYUHYO_TOMORROW_PM_STATUS: {
      rawHeader: "PM2",
      targetPath: "tomorrow.pmStatus",
    },
    KOKYUHYO_TOMORROW_PM_DETAIL: {
      rawHeader: "PM2詳細",
      targetPath: "tomorrow.pmDetail",
    },

    // Jugyoin 用の明日分表記
    JUGYOIN_TOMORROW_AM_STATUS: {
      rawHeader: "tomorrowAmStatus",
      targetPath: "tomorrow.amStatus",
    },
    JUGYOIN_TOMORROW_AM_DETAIL: {
      rawHeader: "tomorrowAmDetail",
      targetPath: "tomorrow.amDetail",
    },
    JUGYOIN_TOMORROW_PM_STATUS: {
      rawHeader: "tomorrowPmStatus",
      targetPath: "tomorrow.pmStatus",
    },
    JUGYOIN_TOMORROW_PM_DETAIL: {
      rawHeader: "tomorrowPmDetail",
      targetPath: "tomorrow.pmDetail",
    },
  },

  // 連絡先共通項目
  CONTACT: {
    EXTENSION: { rawHeader: "naisen", targetPath: "contact.extension" },
    MOBILE_SHORT: { rawHeader: "tanshuku", targetPath: "contact.mobileShort" },
    MOBILE: { rawHeader: "contactMobile", targetPath: "contact.mobile" },
  },

  // 店舗マスター項目
  SHOP: {
    CODE: { rawHeader: "shopCode", targetPath: "code" },
    NAME: { rawHeader: "shopName", targetPath: "name" },
    KANA: { rawHeader: "shopKana", targetPath: "nameKana" },
    OPEN_TIME: { rawHeader: "openTime", targetPath: "businessHoursStart" },
    CLOSE_TIME: { rawHeader: "closeTime", targetPath: "businessHoursEnd" },
    MOBILE_SALES: { rawHeader: "idoHanbai", targetPath: "idoHanbai" },
    SUB_MANAGER1: { rawHeader: "subManager1", targetPath: "subManagerName1" },
    SUB_MANAGER2: { rawHeader: "subManager2", targetPath: "subManagerName2" },
    AREA: { rawHeader: "areaName", targetPath: "area" },
    PRINTER_B_MODEL: {
      rawHeader: "printerModelB",
      targetPath: "printerB.model",
    },
    PRINTER_B_SERIAL: {
      rawHeader: "printerSerialB",
      targetPath: "printerB.serial",
    },
    PRINTER_B_CALL: {
      rawHeader: "printerCallB",
      targetPath: "printerB.callTarget",
    },
    PRINTER_B_HOLIDAY: {
      rawHeader: "printerHolidayB",
      targetPath: "printerB.weekendSupport",
    },
    PRINTER_B_CONTRACT: {
      rawHeader: "printerContractIdB",
      targetPath: "printerB.contractId",
    },
    PRINTER_K_MODEL: {
      rawHeader: "printerModelK",
      targetPath: "printerK.model",
    },
    PRINTER_K_SERIAL: {
      rawHeader: "printerSerialK",
      targetPath: "printerK.serial",
    },
    PRINTER_K_CALL: {
      rawHeader: "printerCallK",
      targetPath: "printerK.callTarget",
    },
    PRINTER_K_HOLIDAY: {
      rawHeader: "printerHolidayK",
      targetPath: "printerK.weekendSupport",
    },
    PRINTER_K_CONTRACT: {
      rawHeader: "printerContractIdK",
      targetPath: "printerK.contractId",
    },
    PRINTER_O_MODEL: {
      rawHeader: "printerModelO",
      targetPath: "printerO.model",
    },
    PRINTER_O_SERIAL: {
      rawHeader: "printerSerialO",
      targetPath: "printerO.serial",
    },
    PRINTER_O_CALL: {
      rawHeader: "printerCallO",
      targetPath: "printerO.callTarget",
    },
    PRINTER_O_HOLIDAY: {
      rawHeader: "printerHolidayO",
      targetPath: "printerO.weekendSupport",
    },
    PRINTER_O_CONTRACT: {
      rawHeader: "printerContractIdO",
      targetPath: "printerO.contractId",
    },
  },
} as const;

/**
 * キーマッピング配列から keyMap レコードを動的生成するヘルパー
 */
export const buildKeyMap = (
  definitions: KeyMappingDefinition[],
): Record<string, string> => {
  const map: Record<string, string> = {};
  definitions.forEach((def) => {
    map[def.rawHeader] = def.targetPath;
  });
  return map;
};

/* ============================================================================
 * 2. 一元管理マスターを参照する共通カラム定義 (局休表ベース: 計80%割り当て)
 * ============================================================================ */
const SCHEDULE_COLUMNS_KOKYUHYO: ColumnDef[] = [
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_STATUS.targetPath,
    label: "AM1",
    width: "8%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_DETAIL.targetPath,
    label: "AM1詳細",
    width: "12%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_STATUS.targetPath,
    label: "PM1",
    width: "8%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_DETAIL.targetPath,
    label: "PM1詳細",
    width: "12%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_STATUS.targetPath,
    label: "AM2",
    width: "8%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_DETAIL.targetPath,
    label: "AM2詳細",
    width: "12%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_STATUS.targetPath,
    label: "PM2",
    width: "8%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_DETAIL.targetPath,
    label: "PM2詳細",
    width: "12%",
    group: "tomorrow",
  },
];

/* 共通スケジュールカラム定義 (従業員ベース: 計70%割り当て) */
const SCHEDULE_COLUMNS_JUGYOIN: ColumnDef[] = [
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_STATUS.targetPath,
    label: "AM1",
    width: "7%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_DETAIL.targetPath,
    label: "AM1詳細",
    width: "10.5%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_STATUS.targetPath,
    label: "PM1",
    width: "7%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_DETAIL.targetPath,
    label: "PM1詳細",
    width: "10.5%",
    group: "today",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_STATUS.targetPath,
    label: "AM2",
    width: "7%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_DETAIL.targetPath,
    label: "AM2詳細",
    width: "10.5%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_STATUS.targetPath,
    label: "PM2",
    width: "7%",
    group: "tomorrow",
  },
  {
    key: SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_DETAIL.targetPath,
    label: "PM2詳細",
    width: "10.5%",
    group: "tomorrow",
  },
];

/* ============================================================================
 * 3. スプレッドシート別データ構成
 * ============================================================================ */
export const SPREADSHEET_CONFIGS: Record<SheetId, SheetDataConfig> = {
  // 1. 店舗マスター (合計 100%)
  [SHEET_IDS.SHOP]: {
    tabName: "StoreMasterData",
    headerRow: 1,
    startColumn: "A",
    endColumn: "AE",
    keyMap: buildKeyMap(Object.values(SHEET_KEY_MASTER.SHOP)),
    columns: [
      {
        key: SHEET_KEY_MASTER.SHOP.CODE.targetPath,
        label: "店番",
        width: "10%",
      },
      {
        key: SHEET_KEY_MASTER.SHOP.NAME.targetPath,
        label: "店舗名",
        width: "20%",
      },
      { key: "phoneNumber", label: "電話番号", width: "15%" },
      { key: "postalCode", label: "郵便番号", width: "15%" },
      { key: "address", label: "住所", width: "40%" },
    ],
  },

  // 2. 局休表マスター (氏名 20% + スケジュール 80% = 合計 100%)
  [SHEET_IDS.KOKYUHYO]: {
    tabName: "KokyuhyoMasterData",
    headerRow: 3,
    startColumn: "A",
    endColumn: "M",
    keyMap: buildKeyMap([
      SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.KOKYUHYO_TOMORROW_AM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.KOKYUHYO_TOMORROW_AM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.KOKYUHYO_TOMORROW_PM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.KOKYUHYO_TOMORROW_PM_DETAIL,
      SHEET_KEY_MASTER.CONTACT.EXTENSION,
      SHEET_KEY_MASTER.CONTACT.MOBILE_SHORT,
      SHEET_KEY_MASTER.CONTACT.MOBILE,
    ]),
    columns: [
      { key: "name", label: "氏名", width: "20%" },
      ...SCHEDULE_COLUMNS_KOKYUHYO,
    ],
  },

  // 3. 従業員マスター (部署 15% + 氏名 15% + スケジュール 70% = 合計 100%)
  [SHEET_IDS.JUGYOIN]: {
    tabName: "JugyoinMasterData",
    headerRow: 3,
    startColumn: "A",
    endColumn: "N",
    keyMap: buildKeyMap([
      { rawHeader: "bumon", targetPath: "department" },
      SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_AM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.TODAY_PM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_AM_DETAIL,
      SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_STATUS,
      SHEET_KEY_MASTER.SCHEDULE.JUGYOIN_TOMORROW_PM_DETAIL,
      SHEET_KEY_MASTER.CONTACT.EXTENSION,
      SHEET_KEY_MASTER.CONTACT.MOBILE_SHORT,
      SHEET_KEY_MASTER.CONTACT.MOBILE,
    ]),
    columns: [
      { key: "department", label: "部署", width: "15%" },
      { key: "name", label: "氏名", width: "15%" },
      ...SCHEDULE_COLUMNS_JUGYOIN,
    ],
  },

  // 4. 担当表マスター (各列 10.4%〜10.5% × 10列 = 合計 100%)
  [SHEET_IDS.TANTOU]: {
    tabName: "KokyuhyoTantouMasterData",
    headerRow: 2,
    startColumn: "A",
    endColumn: "J",
    columns: [
      { key: "today.hayaban", label: "早番", width: "10.5%" },
      { key: "today.shikai", label: "司会", width: "10.5%" },
      { key: "today.uketsuke", label: "受付", width: "10.5%" },
      { key: "today.denwa", label: "電話", width: "10.5%" },
      { key: "today.nimotsu", label: "荷物", width: "10.5%" },
      { key: "today.floor2f", label: "2F", width: "8.5%" },
      { key: "today.floor3f", label: "3F", width: "8.5%" },
      { key: "today.tensou", label: "転送", width: "10.5%" },
      { key: "today.amAttendance", label: "AM出勤率", width: "10%" },
      { key: "today.pmAttendance", label: "PM出勤率", width: "10%" },
    ],
  },
};

/**
 * シート個別の設定から API 呼び出し用の Range 文字列・headerRow・keyMap を動的に生成
 */
export const getSheetRangeConfig = (sheetId: SheetId) => {
  const config = SPREADSHEET_CONFIGS[sheetId];

  if (!config) {
    return {
      headerRow: 1,
      dynamicRange: `${sheetId}!1:10000`,
      keyMap: undefined,
    };
  }

  const { tabName, headerRow, startColumn, endColumn, keyMap } = config;

  return {
    headerRow,
    dynamicRange: `${tabName}!${startColumn}${headerRow}:${endColumn}10000`,
    keyMap,
  };
};
