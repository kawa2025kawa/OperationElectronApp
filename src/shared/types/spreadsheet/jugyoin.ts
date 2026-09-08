// src/shared/types/spreadsheet/jugyoin.ts

import type { ContactInfo, DailySchedule } from "./common";

export interface Jugyoin {
  id: string;
  bumon: string;
  name: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}
