// electron/features/gmail/templates/templateE8.ts
//シェルフラベル発注

import type { GmailDraft } from "@shared/types/electron/ipcTypes";

export function createTemplateE8(): GmailDraft {
  return {
    to: "mw-data@tkcc-jp.com",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "【ベルク】プライスカード申し込み",
    body: "ここにリンクを貼り付け",
  };
}
