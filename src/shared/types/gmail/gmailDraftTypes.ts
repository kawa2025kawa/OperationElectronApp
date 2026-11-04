// src/shared/types/gmail/gmailDraftTypes.ts

export type EmailTemplateKey = "E8" | "E9" | "E10" | "E88";

export interface GmailDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export type GmailDraftFormValues = GmailDraft;

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

/**
 * 各メールテンプレートの固定送信先・連絡先・件名などの設定値集約
 * ※既存のハードコード内容を完全維持
 */
export const GMAIL_TEMPLATE_CONFIG = {
  E8: {
    to: "mw-data@tkcc-jp.com",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "【ベルク】プライスカード申し込み",
    placeholderBody: "ここにリンクを貼り付け",
  },
  E9: {
    to: "belc@taiyosha-insatsu.co.jp",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "ベルク POPデータ",
    placeholderBody: "ここにリンクを貼り付け",
  },
  E10: {
    recipients: [
      "hassan-a@aeonpeople.biz",
      "taguchi-hisao@aeonpeople.biz",
      "mitamura-to@aeonpeople.biz",
      "takashima-ru@aeonpeople.biz",
      "sasaki-t@aeonpeople.biz",
    ] as const,
    cc: "ml-sec-digisui-all@belc.co.jp",
    subjectPrefix: "【送付】",
    subjectSuffix: " トップバリュ売上実績（ベルク）",
    destinationName: "イオントップバリュ株式会社 担当者様",
    placeholderLinkText: "※ここにリンクを貼り付け",
  },
  E88: {
    to: "mw-data@tkcc-jp.com",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "【ベルク】プライスカード申し込み",
    destinationDept: [
      "高崎共同計算センター",
      "アウトソーシングサービス部",
      "ご担当者様",
    ] as const,
    contactPhone: "049-287-1117",
    placeholderLinkText: '※"ここにリンクを貼り付け",',
  },
} as const;
