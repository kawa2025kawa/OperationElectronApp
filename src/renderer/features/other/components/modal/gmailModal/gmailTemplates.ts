// src/renderer/features/other/components/modal/gmailModal/gmailTemplates.ts

export interface EmailTemplateContext {
  lastName: string;
  nextTuesdayStr: string;
  links?: Record<string, string> | null;
}

export interface EmailTemplate {
  to: string;
  cc?: string;
  subject: string;
  generateBody: (ctx: EmailTemplateContext) => string;
}

export type EmailTemplateKey = "E8" | "E9";

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
  template: EmailTemplate;
}

// =====================================================
// Individual Templates
// =====================================================

export const shelfLabelTemplate: EmailTemplate = {
  to: "mw-data@tkcc-jp.com",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "【ベルク】プライスカード申し込み",
  generateBody: ({ lastName, nextTuesdayStr, links }) => {
    let linkText = "";
    if (links && Object.keys(links).length > 0) {
      linkText = Object.entries(links)
        .map(([label, url]) => `${label}: ${url}`)
        .join("\n");
    }

    return `高崎共同計算センターアウトソーシングサービス部

ご担当者様いつもお世話になっております。
ベルクの${lastName}です。

シェルフラベルデータの発行をお願いします。
FAXは送信いたしません。

１．納品希望日：${nextTuesdayStr}
２．担当者名称：${lastName}
３．連絡先電話：049-287-1117

${linkText ? `■ 関連リンク\n${linkText}` : ""}

以上、よろしくお願いいたします。`;
  },
};

export const popLabelTemplate: EmailTemplate = {
  to: "belc@taiyosha-insatsu.co.jp",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "ベルク　POPデータ",
  generateBody: ({ links }) => {
    if (!links || Object.keys(links).length === 0) {
      return "";
    }

    return Object.entries(links)
      .map(([label, url]) => `${label}: ${url}`)
      .join("\n");
  },
};

// =====================================================
// Template Resolvers & Options
// =====================================================

const TEMPLATES_BY_KEY: Record<EmailTemplateKey, EmailTemplate> = {
  E8: shelfLabelTemplate,
  E9: popLabelTemplate,
};

export const EMAIL_TEMPLATE_OPTIONS: readonly EmailTemplateOption[] = [
  {
    key: "E8",
    label: "シェルフラベル",
    template: shelfLabelTemplate,
  },
  {
    key: "E9",
    label: "POPデータ",
    template: popLabelTemplate,
  },
];

const defaultTemplate: EmailTemplate = {
  to: "",
  subject: "【作業連絡】",
  generateBody: ({ lastName }) =>
    `ご担当者様\n\nお世話になっております。ベルクの${lastName}です。\n\nよろしくお願いいたします。`,
};

export function getEmailTemplate(kanriNo?: string): EmailTemplate {
  if (!kanriNo) {
    return defaultTemplate;
  }

  return TEMPLATES_BY_KEY[kanriNo as EmailTemplateKey] ?? defaultTemplate;
}
