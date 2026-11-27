// electron/features/gmail/templates/templateE9.ts

import type { GmailDraft } from "@shared/types/electron/ipcTypes";

export function createTemplateE9(): GmailDraft {
  return {
    to: "belc@taiyosha-insatsu.co.jp",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "ベルク POPデータ",
    body: "ここにリンクを貼り付け",
  };
}
