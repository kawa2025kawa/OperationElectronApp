import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  chromeUserDataDir: path.join(__dirname, "../../.chrome-profile"),
};

(async () => {
  console.log(
    "⚡ 逆引き検証中: 組織側 (type: 40) の members から部署名を引けるかテストしています...",
  );

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: CONFIG.chromeUserDataDir,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const existingPages = await browser.pages();
    const page = await browser.newPage();
    page.on("dialog", async (dialog) => await dialog.accept());
    for (const oldPage of existingPages) await oldPage.close().catch(() => {});

    await page.goto(CONFIG.addressBookUrl, { waitUntil: "networkidle2" });

    const debugResult = await page.evaluate(() => {
      const key = "belc.co.jp/AddressList-1.00/data";
      const rawStr = localStorage.getItem(key);
      if (!rawStr) return "localStorage data が空です";

      let list = [];
      if (typeof window.decompress === "function") {
        list = window.decompress(rawStr);
      } else if (
        typeof window.AddressList !== "undefined" &&
        window.AddressList.data
      ) {
        list = window.AddressList.data;
      } else {
        try {
          list = JSON.parse(rawStr);
        } catch (e) {
          return "JSON parse エラー";
        }
      }

      // 1. メールアドレス -> 部署名 の逆引きマップを作成
      const emailToDeptMap = new Map();
      const idToDeptMap = new Map();

      list.forEach((item) => {
        // 部署/組織ノード
        if (item.name1 && item.members) {
          const deptName = item.name1.trim();
          let memberList = [];

          if (Array.isArray(item.members)) {
            memberList = item.members;
          } else if (
            item.members.values &&
            Array.isArray(item.members.values)
          ) {
            memberList = item.members.values;
          }

          memberList.forEach((m) => {
            if (typeof m === "string") {
              if (m.includes("@")) {
                emailToDeptMap.set(m.trim().toLowerCase(), deptName);
              } else {
                idToDeptMap.set(m.trim(), deptName);
              }
            }
          });
        }
      });

      // 2. 個人データの先頭 5 件で部署名がヒットするかテスト
      const persons = list
        .filter((item) => {
          const k1 = (item.nameKana1 || "").trim();
          const k2 = (item.nameKana2 || "").trim();
          return (k1 !== "" || k2 !== "") && item.email;
        })
        .slice(0, 5);

      return persons.map((p) => {
        const mail = (p.email || "").trim().toLowerCase();
        const foundDeptByEmail = emailToDeptMap.get(mail) || "";
        const foundDeptById = idToDeptMap.get(p.id) || "";

        return {
          name: `${p.name1} ${p.name2}`,
          email: p.email,
          id: p.id,
          matchedDeptByEmail: foundDeptByEmail,
          matchedDeptById: foundDeptById,
        };
      });
    });

    console.log("==========================================");
    console.log("🔍 逆引き結果:");
    console.log(JSON.stringify(debugResult, null, 2));
    console.log("==========================================");
  } catch (error) {
    console.error("❌ エラー:", error.message);
  } finally {
    await browser.close();
  }
})();
