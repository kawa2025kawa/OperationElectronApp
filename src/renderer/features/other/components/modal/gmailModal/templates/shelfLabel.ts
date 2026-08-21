//src\renderer\features\operation\components\modal\gmailModal\templates\shelfLabel.ts

import type { EmailTemplate } from "./types";

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
