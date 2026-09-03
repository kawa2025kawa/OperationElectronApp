import type { ContactInfo, DailySchedule } from "./common";

export interface Jugyoin {
  id: string;
  department: string; // 従業員シート特有のフィールド
  name: string;
  baseDetail: string;
  contact: ContactInfo;
  scheduleLink: string;
  today: DailySchedule;
  tomorrow: DailySchedule;
}
