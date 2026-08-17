//src\shared\types\spreadsheetTypes.ts

/* =====================================================
   1. Sheet IDs & Domain Types
   ===================================================== */
export const MASTER_SPREADSHEET_ID =
  "1TFQ0qoXvr1PW80BBNbYZ2dyVDusQCarknrrqJi50HBc";

export const SHEET_IDS = {
  SHOP: "StoreMasterData",
  KOKYUHYO: "KokyuhyoMasterData",
  JUGYOIN: "JugyoinMasterData",
  TANTOU: "KokyuhyoTantouMasterData",
} as const;

export type SheetId = (typeof SHEET_IDS)[keyof typeof SHEET_IDS];

export const SHEET_TYPES = {
  Store: "Store",
  Kokyuhyo: "Kokyuhyo",
  Jugyoin: "Jugyoin",
  Tantou: "Tantou",
} as const;

export type SheetType = (typeof SHEET_TYPES)[keyof typeof SHEET_TYPES] | "Raw";

/* =====================================================
   2. Data Models (Entities)
   ===================================================== */
export interface PrinterInfo {
  type?: string;
  maker?: string;
  model: string;
  serial: string;
  callTarget: string;
  weekendSupport: string;
  contractId: string;
}

export interface ContactInfo {
  extension: string;
  mobileShort: string;
  mobile: string;
}

export interface DailySchedule {
  date: string;
  amStatus: string;
  amDetail: string;
  pmStatus: string;
  pmDetail: string;
}

export interface TantouDailyDetails {
  hayaban: string;
  shikai: string;
  uketsuke: string;
  denwa: string;
  nimotsu: string;
  "2F": string;
  "3F": string;
  tensou: string;
  amAttendanceRate: string;
  pmAttendanceRate: string;
}

export interface Shop {
  id: string;
  code: string;
  name: string;
  nameKana?: string;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  businessHours?: string;
  centerName: string;
  area: string;
  phoneNumber: string;
  postalCode: string;
  address: string;
  idoHanbai?: string;
  printerB?: PrinterInfo;
  printerK?: PrinterInfo;
  printerO?: PrinterInfo;
  managerName?: string;
  subManagerName1?: string;
  subManagerName2?: string;
  areaManagerName?: string;
}

export interface Kokyuhyo {
  id: string;
  name: string;
  baseDetail: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}

export interface Jugyoin {
  id: string;
  department: string;
  name: string;
  baseDetail: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}

export interface Tantou {
  id: string;
  today: TantouDailyDetails;
  tomorrow: TantouDailyDetails;
}

/* =====================================================
   3. Row & Data Mapping
   ===================================================== */
export type SheetRowMap = {
  [SHEET_IDS.SHOP]: Shop;
  [SHEET_IDS.KOKYUHYO]: Kokyuhyo;
  [SHEET_IDS.JUGYOIN]: Jugyoin;
  [SHEET_IDS.TANTOU]: Tantou;
};

export interface SheetDataResponse {
  sheetType: SheetType;
  data: unknown[];
}
