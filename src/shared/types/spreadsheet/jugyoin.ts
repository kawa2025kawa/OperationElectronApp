// src/shared/types/spreadsheet/jugyoin.ts

/**
 * 各フィールドのキーと日本語ラベルを一元管理
 */
export const JUGYOIN_FIELD_LABELS = {
  id: "ID",
  bumon: "部門",
  bumonKana: "部門カナ",
  name: "氏名",
  nameKana: "氏名カナ",
  todayAmStatus: "今日AM区分",
  todayAmDetail: "今日AM詳細",
  todayPmStatus: "今日PM区分",
  todayPmDetail: "今日PM詳細",
  tomorrowAmStatus: "明日AM区分",
  tomorrowAmDetail: "明日AM詳細",
  tomorrowPmStatus: "明日PM区分",
  tomorrowPmDetail: "明日PM詳細",
  naisen: "内線",
  tanshuku: "短縮",
  contactMobile: "連絡先携帯",
  scheduleLink: "スケジュールリンク",
  position: "役職",
  email: "メールアドレス",
} as const;

export type JugyoinKey = keyof typeof JUGYOIN_FIELD_LABELS;
export type Jugyoin = Record<JugyoinKey, string>;
