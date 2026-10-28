// electron/features/gmail/templates/templateE10.ts

import type { GmailDraft } from "../gmailTypes";
import { getPreviousYearMonth } from "../gmailUtils";

export function createTemplateE10(familyName = ""): GmailDraft {
  const ym = getPreviousYearMonth();

  return {
    to: [
      "hassan-a@aeonpeople.biz",
      "taguchi-hisao@aeonpeople.biz",
      "mitamura-to@aeonpeople.biz",
      "takashima-ru@aeonpeople.biz",
      "sasaki-t@aeonpeople.biz",
    ].join("\n"),
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: `【送付】${ym} トップバリュ売上実績（ベルク）`,
    body: [
      "イオントップバリュ株式会社 担当者様",
      "",
      "いつもお世話になっております。",
      `ベルクの${familyName}です。`,
      "",
      `${ym} 「トップバリュ商品 販売実績」及び、「部門別売上実績」をご報告いたします。`,
      "下記リンクよりダウンロードをお願いいたします。",
      "",
      "※ここにリンクを貼り付け",
      "",
      "以上、よろしくお願いいたします。",
    ].join("\n"),
  };
}
