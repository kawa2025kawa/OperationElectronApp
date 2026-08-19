import type { EmailTemplate } from "./types";

export const topValueSalesTemplate: EmailTemplate = {
  to: "hassan-a@aeonpeople.biz, taguchi-hisao@aeonpeople.biz, mitamura-to@aeonpeople.biz, takashima-ru@aeonpeople.biz, sasaki-t@aeonpeople.biz",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "【送付】YYYY年MM月 トップバリュ売上実績（ベルク）",

  generateBody: ({ lastName }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return [
      "いつもお世話になっております。",
      `ベルクの${lastName}です。`,
      "",
      `${year}年${month}月 【トップバリュ商品 単品】及び、【部門別売上実績】をご報告致します。`,
      "下記リンクよりダウンロードをお願い致します。",
      "",
      "※ここにリンクを貼り付け",
      "",
      "以上、よろしくお願い致します。",
    ].join("\n");
  },
};
