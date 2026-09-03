import type { ContactInfo, DailySchedule } from "./common";

export interface Kokyuhyo {
  id: string;
  name: string;
  baseDetail: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}
