// src/renderer/features/other/templates/gmailTemplates.ts

import type { EmailTemplateKey } from "@renderer/features/other/types/gmailDraftTypes";

export interface EmailTemplateContext {
  lastName: string;
  nextTuesdayStr: string;
  links?: Record<string, string> | null;
}

export interface EmailTemplate {
  to: string;
  cc?: string;
  subject: string;
  generateBody: (context: EmailTemplateContext) => string;
}

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

const getPreviousYearMonth = (): string => {
  const date = new Date();

  date.setDate(1);
  date.setMonth(date.getMonth() - 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}年${month}月`;
};

const shelfLabelTemplate: EmailTemplate = {
  to: "mw-data@tkcc-jp.com",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "ベルク シェルフラベルデータ発注依頼",
  generateBody: ({ lastName, nextTuesdayStr, links }) => {
    let linkText = "";

    if (links && Object.keys(links).length > 0) {
      linkText = Object.entries(links)
        .map(([label, url]) => `${label}: ${url}`)
        .join("\n");
    }

    return `高崎商品管理センターアウトソーシングサービス部

お疲れ様です。いつもお世話になっております。
ベルクの${lastName}です。

シェルフラベルデータの発行をお願いいたします。
FAXは送信いたしません。

・商品納品希望日：${nextTuesdayStr}
・担当者氏名：${lastName}
・連絡先電話：49-287-1117

${linkText ? `■ 関連リンク\n${linkText}` : ""}

以上、よろしくお願いいたします。`;
  },
};

const popLabelTemplate: EmailTemplate = {
  to: "belc@taiyosha-insatsu.co.jp",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "ベルク POPデータ",
  generateBody: ({ links }) => {
    if (!links || Object.keys(links).length === 0) {
      return "";
    }

    return Object.entries(links)
      .map(([label, url]) => `${label}: ${url}`)
      .join("\n");
  },
};

const topValuSalesTemplate: EmailTemplate = {
  to: [
    "hassan-a@aeonpeople.biz",
    "taguchi-hisao@aeonpeople.biz",
    "mitamura-to@aeonpeople.biz",
    "takashima-ru@aeonpeople.biz",
    "sasaki-t@aeonpeople.biz",
  ].join("\n"),

  cc: "ml-sec-digisui-all@belc.co.jp",

  get subject() {
    return `前月実績 ${getPreviousYearMonth()} トップバリュ売上実績（ベルク）`;
  },

  generateBody: ({ lastName, links }) => {
    const ym = getPreviousYearMonth();

    let linkText = "";

    if (links && Object.keys(links).length > 0) {
      linkText = Object.entries(links)
        .map(([label, url]) => `${label}: ${url}`)
        .join("\n");
    }

    return `イオントップバリュ株式会社 担当者様

いつもお世話になっております。
ベルクの${lastName}です。

${ym} 「トップバリュ商品 販売実績」及び、「部門別売上実績」をご報告いたします。
下記リンクよりダウンロードをお願いいたします。

※ここにリンクを貼り付け

${linkText}

以上、よろしくお願いいたします。`;
  },
};

const TEMPLATES_BY_KEY: Record<EmailTemplateKey, EmailTemplate> = {
  E8: shelfLabelTemplate,
  E9: popLabelTemplate,
  E10: topValuSalesTemplate,
};

export const EMAIL_TEMPLATE_OPTIONS = [
  { key: "E8", label: "シェルフラベル" },
  { key: "E9", label: "POPデータ" },
  { key: "E10", label: "トップバリュ売上実績" },
] as const satisfies readonly EmailTemplateOption[];

export function getEmailTemplate(key: EmailTemplateKey): EmailTemplate {
  return TEMPLATES_BY_KEY[key];
}
