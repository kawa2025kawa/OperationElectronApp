// electron/features/gmail/templates/templateE88.ts
//新店シェルフラベル発注

import { format, nextMonday } from "date-fns";
import { ja } from "date-fns/locale";
import type { GmailDraft } from "../gmailTypes";

export function createTemplateE88(familyName = ""): GmailDraft {
  const deliveryDate = format(nextMonday(new Date()), "M月d日(E)", {
    locale: ja,
  });

  return {
    to: "mw-data@tkcc-jp.com",
    cc: "ml-sec-digisui-all@belc.co.jp",
    subject: "【ベルク】プライスカード申し込み",
    body: [
      "高崎共同計算センター",
      "アウトソーシングサービス部",
      "ご担当者様",
      "",
      "いつもお世話になっております。",
      `ベルクの${familyName}です。`,
      "",
      "シェルフラベルデータの発行をお願いいたします。",
      "FAXは送信いたしません。",
      "",
      `1. 納品希望日：${deliveryDate}`,
      `2. 担当者名称：${familyName}`,
      "3. 連絡先電話：049-287-1117",
      "",
      '※"ここにリンクを貼り付け",',
      "",
      "以上、よろしくお願いいたします。",
    ].join("\n"),
  };
}