// src/shared/types/spreadsheet/common.ts

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

export interface BaseSheetEntity {
  id: string;
  name?: string;
}
