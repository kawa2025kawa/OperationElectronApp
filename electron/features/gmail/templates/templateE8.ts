// electron/features/gmail/templates/templateE8.ts
//シェルフラベル発注
import type { GmailDraft } from "../gmailTypes";

export function createTemplateE8(
  _familyName = "",
  _links?: Record<string, string> | null,
): GmailDraft {
  return {
    to: "mw-data@tkcc-jp.com",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "【ベルク】プライスカード申し込み",
    body: "ここにリンクを貼り付け",
  };
}
