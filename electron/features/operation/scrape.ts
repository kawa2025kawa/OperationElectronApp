import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { Page, Dialog } from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  addressBookUrl: string;
  chromeUserDataDir: string;
}

const CONFIG: Config = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  chromeUserDataDir: path.join(__dirname, "../../../.chrome-profile"),
};

(async (): Promise<void> => {
  console.log(
    "⚡ デバッグ解析中: roleMap (役職マスタ) からの役職名変換を検証しています...",
  );

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: CONFIG.chromeUserDataDir,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const existingPages: Page[] = await browser.pages();
    const page: Page = await browser.newPage();
    page.on("dialog", async (dialog: Dialog) => await dialog.accept());
    for (const oldPage of existingPages) await oldPage.close().catch(() => {});

    await page.goto(CONFIG.addressBookUrl, { waitUntil: "networkidle2" });

    const debugResult = await page.evaluate(() => {
      // 1. roleMap (役職マスタ) の取得
      const rawRoleMap = localStorage.getItem(
        "belc.co.jp/AddressList-1.00/roleMap",
      );
      let roleMapObj: any = null;
      if (rawRoleMap) {
        try {
          roleMapObj = JSON.parse(rawRoleMap);
        } catch (e) {}
      }

      // 2. 個人データの解凍・取得
      const rawStr = localStorage.getItem("belc.co.jp/AddressList-1.00/data");
      let list: any[] = [];
      const win = window as any;

      if (rawStr) {
        if (typeof win.decompress === "function") {
          list = win.decompress(rawStr);
        } else if (
          typeof win.AddressList !== "undefined" &&
          win.AddressList.data
        ) {
          list = win.AddressList.data;
        } else {
          try {
            list = JSON.parse(rawStr);
          } catch (e) {}
        }
      }

      if (!Array.isArray(list)) return "データが配列ではありません";

      // 3. 個人データの先頭5件について roleId から役職名を引いてみるテスト
      const persons = list
        .filter((item: any) => {
          const k1 = (item.nameKana1 || "").trim();
          const k2 = (item.nameKana2 || "").trim();
          return k1 !== "" || k2 !== "";
        })
        .slice(0, 5);

      const mappedPersons = persons.map((p: any) => {
        let matchedPosition = "";
        if (p.roleId && roleMapObj) {
          // roleMap の形式に合わせて取得を試行
          if (roleMapObj[p.roleId]) {
            matchedPosition =
              typeof roleMapObj[p.roleId] === "string"
                ? roleMapObj[p.roleId]
                : roleMapObj[p.roleId].name ||
                  roleMapObj[p.roleId].roleName ||
                  JSON.stringify(roleMapObj[p.roleId]);
          }
        }

        return {
          name: `${p.name1} ${p.name2}`,
          roleId: p.roleId,
          matchedPosition,
        };
      });

      return {
        roleMapSample: roleMapObj
          ? Object.entries(roleMapObj).slice(0, 5)
          : null,
        mappedPersons,
      };
    });

    console.log("==========================================");
    console.log("🔍 roleMap 解析結果:");
    console.log(JSON.stringify(debugResult, null, 2));
    console.log("==========================================");
  } catch (error: any) {
    console.error("❌ エラー:", error.message || error);
  } finally {
    await browser.close();
  }
})();
