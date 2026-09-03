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

export interface Tantou {
  id: string;
  today: TantouDailyDetails;
  tomorrow: TantouDailyDetails;
}
