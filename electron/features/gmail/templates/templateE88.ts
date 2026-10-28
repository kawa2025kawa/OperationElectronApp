// electron/features/gmail/templates/templateE88.ts
//新店シェルフラベル発注

import type { GmailDraft } from "../gmailTypes";

export function createTemplateE88(familyName = ""): GmailDraft {
  // 翌週の月曜日を取得
  const today = new Date();
  const nextMonday = new Date(today);
  const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const deliveryDate = `${nextMonday.getMonth() + 1}月${nextMonday.getDate()}日(月)`;

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
