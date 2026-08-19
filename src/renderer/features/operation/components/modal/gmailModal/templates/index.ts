import type { EmailTemplate } from "./types";
import { shelfLabelTemplate } from "./shelfLabel";
import { popLabelTemplate } from "./popLabel";

// 管理番号 (kanriNo) によるマッピング
const TEMPLATES_BY_KANRI_NO: Record<string, EmailTemplate> = {
  E8: shelfLabelTemplate,
  E9: popLabelTemplate,
};

// 該当するテンプレートが見つからない場合のフォールバック
const defaultTemplate: EmailTemplate = {
  to: "",
  subject: "【作業連絡】",
  generateBody: ({ lastName }) =>
    `ご担当者様\n\nお世話になっております。ベルクの${lastName}です。\n\nよろしくお願いいたします。`,
};

export function getEmailTemplate(kanriNo?: string): EmailTemplate {
  if (!kanriNo) return defaultTemplate;
  return TEMPLATES_BY_KANRI_NO[kanriNo] ?? defaultTemplate;
}

export * from "./types";
