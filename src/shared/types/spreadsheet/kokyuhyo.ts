//src\shared\types\spreadsheet\kokyuhyo.ts

import type { ContactInfo, DailySchedule } from "./common";

export interface Kokyuhyo {
  id: string;
  name: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}
