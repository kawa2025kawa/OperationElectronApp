// src/shared/types/spreadsheet/tantou.ts

/**
 * 1. 各フィールドの「キー」と「日本語ラベル」を一元管理
 */
export const TANTOU_FIELD_LABELS = {
  id: "ID",

  // 本日（today）
  todayHayaban: "本日 早番",
  todayShikai: "本日 司会",
  todayUketsuke: "本日 受付",
  todayDenwa: "本日 電話",
  todayNimotsu: "本日 荷物",
  today2F: "本日 2F",
  today3F: "本日 3F",
  todayTensou: "本日 転送",
  todayAmAttendanceRate: "本日 AM出勤率",
  todayPmAttendanceRate: "本日 PM出勤率",

  // 明日（tomorrow）
  tomorrowHayaban: "明日 早番",
  tomorrowShikai: "明日 司会",
  tomorrowUketsuke: "明日 受付",
  tomorrowDenwa: "明日 電話",
  tomorrowNimotsu: "明日 荷物",
  tomorrow2F: "明日 2F",
  tomorrow3F: "明日 3F",
  tomorrowTensou: "明日 転送",
  tomorrowAmAttendanceRate: "明日 AM出勤率",
  tomorrowPmAttendanceRate: "明日 PM出勤率",
} as const;

/**
 * 2. オブジェクトのキーから Tantou 型を自動生成
 */
export type TantouKey = keyof typeof TANTOU_FIELD_LABELS;
export type Tantou = Record<TantouKey, string>;
