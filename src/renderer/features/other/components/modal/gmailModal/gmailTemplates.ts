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

export type EmailTemplateKey = "E8" | "E9" | "E10";

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
  template: EmailTemplate;
}

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

/**
 * 前月（yyyy年mm月）を取得する関数
 */
const getPreviousYearMonth = (): string => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}年${month}月`;
};

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

export const topValuSalesTemplate: EmailTemplate = {
  to: [
    "hassan-a@aeonpeople.biz",
    "taguchi-hisao@aeonpeople.biz",
    "mitamura-to@aeonpeople.biz",
    "takashima-ru@aeonpeople.biz",
    "sasaki-t@aeonpeople.biz",
  ].join("\n"),
  cc: "ml-sec-digisui-all@belc.co.jp",
  get subject() {
    return `【送付】${getPreviousYearMonth()} トップバリュ売上実績（ベルク）`;
  },
  generateBody: ({ lastName, links }) => {
    const ym = getPreviousYearMonth();
    let linkText = "";
    if (links && Object.keys(links).length > 0) {
      linkText = Object.entries(links)
        .map(([label, url]) => `${label}: ${url}`)
        .join("\n");
    }

    return `イオントップバリュ株式会社 各位

いつもお世話になっております。
ベルクの${lastName}です。

${ym} 【トップバリュ商品 単品】及び、【部門別売上実績】をご報告致します。
下記リンクよりダウンロードをお願い致します。

※ここにリンクを貼り付け

以上、よろしくお願い致します。`;
  },
};

// =====================================================
// Template Resolvers & Options
// =====================================================

const TEMPLATES_BY_KEY: Record<EmailTemplateKey, EmailTemplate> = {
  E8: shelfLabelTemplate,
  E9: popLabelTemplate,
  E10: topValuSalesTemplate,
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
  {
    key: "E10",
    label: "トップバリュ売上実績",
    template: topValuSalesTemplate,
  },
];

export function getEmailTemplate(kanriNo?: string): EmailTemplate {
  if (!kanriNo || !(kanriNo in TEMPLATES_BY_KEY)) {
    throw new Error(
      `[getEmailTemplate] 未定義または無効なテンプレートキーが指定されました: "${kanriNo}"`,
    );
  }

  return TEMPLATES_BY_KEY[kanriNo as EmailTemplateKey];
}
