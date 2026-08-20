//src\renderer\features\operation\components\modal\gmailModal\templates\popLabel.ts

import type { EmailTemplate } from "./types";

export const popLabelTemplate: EmailTemplate = {
  to: "belc@taiyosha-insatsu.co.jp",
  cc: "ml-sec-digisui-all@belc.co.jp",
  subject: "ベルク　POPデータ",
  generateBody: ({ links }) => {
    if (!links || Object.keys(links).length === 0) {
      return "";
    }

    return Object.entries(links)
      .map(([label, url]) => `${label}: ${url}`)
      .join("\n");
  },
};
