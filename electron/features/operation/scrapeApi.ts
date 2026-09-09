//　実行command
//　npx tsx electron/features/operation/scrapeApi.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { Page, Dialog } from "puppeteer";
import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 型定義
// ==========================================
interface AppConfig {
  addressBookUrl: string;
  spreadsheetIds: string[]; // 複数スプレッドシートに対応
  targetSheetName: string;
  credentialsPath: string;
  tokenPath: string;
  chromeUserDataDir: string;
}

interface AddressItem {
  id?: string;
  name1?: string;
  name2?: string;
  nameKana1?: string;
  nameKana2?: string;
  department?: string;
  position?: string;
  roleId?: string;
  roleName?: string;
  email?: string;
  phone?: string;
  members?: string[] | { values?: string[] };
}

interface ExtractedPerson {
  nameKana1: string;
  nameKana2: string;
  name1: string;
  name2: string;
  department: string;
  position: string;
  email: string;
  phone: string;
}

// ==========================================
// 設定情報
// ==========================================
const CONFIG: AppConfig = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  spreadsheetIds: [
    "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    "1DdhzdvH-Z33sK6Zfk8_ZHBqVBmB0MxD9su0NVbge8gI",
  ],
  targetSheetName: "CloudStep",

  credentialsPath: path.join(
    __dirname,
    "../../../resources/google-oauth-credentials.json",
  ),
  tokenPath: path.join(__dirname, "../../../resources/token.json"),

  chromeUserDataDir: path.join(__dirname, "../../../.chrome-profile"),
};

async function getOAuth2Client(): Promise<OAuth2Client> {
  if (!fs.existsSync(CONFIG.credentialsPath)) {
    throw new Error(
      `OAuth 鍵ファイルが見つかりません: ${CONFIG.credentialsPath}`,
    );
  }

  const keysContent = fs.readFileSync(CONFIG.credentialsPath, "utf-8");
  const keys = JSON.parse(keysContent);
  const { client_secret, client_id, redirect_uris } =
    keys.installed || keys.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris ? redirect_uris[0] : "http://localhost",
  );

  if (fs.existsSync(CONFIG.tokenPath)) {
    const token = fs.readFileSync(CONFIG.tokenPath, "utf-8");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  console.log(
    "\n🔑 Google 認証が必要です。以下の URL をブラウザで開き、認可コードを取得してください:",
  );
  console.log(authUrl + "\n");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question("認可コードを入力してください: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(CONFIG.tokenPath, JSON.stringify(tokens, null, 2), "utf-8");
  console.log("💾 認証トークンを保存しました:", CONFIG.tokenPath);

  return oAuth2Client;
}

(async (): Promise<void> => {
  console.log(
    "⚡ [1/3] 専用プロファイル (.chrome-profile) でブラウザを起動しています...",
  );

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: CONFIG.chromeUserDataDir,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let shouldCloseBrowser = true;

  try {
    const existingPages: Page[] = await browser.pages();
    const page: Page = await browser.newPage();

    page.on("dialog", async (dialog: Dialog) => {
      await dialog.accept();
    });

    for (const oldPage of existingPages) {
      await oldPage.close().catch(() => {});
    }

    console.log("🔑 アドレス帳ページへ遷移中...");
    await page.goto(CONFIG.addressBookUrl, { waitUntil: "networkidle2" });

    console.log(
      "📦 [2/3] localStorage からデータ抽出（部署の逆引き＆役職IDマッピング処理）中...",
    );

    const extractedData = await page.evaluate((): ExtractedPerson[] => {
      // 1. roleMap (役職マスタ) の取得と読み込み
      const rawRoleMap = localStorage.getItem(
        "belc.co.jp/AddressList-1.00/roleMap",
      );
      let roleMapObj: Record<string, any> = {};
      if (rawRoleMap) {
        try {
          roleMapObj = JSON.parse(rawRoleMap);
        } catch (e) {}
      }

      // 2. アドレス帳データの取得と解凍
      const key = "belc.co.jp/AddressList-1.00/data";
      const rawStr = localStorage.getItem(key);
      if (!rawStr) return [];

      let list: any[] = [];
      const win = window as any;

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
        } catch (e) {
          list = [];
        }
      }

      if (!Array.isArray(list)) return [];

      // 3. メールアドレス -> 部署名 の逆引きマップを作成
      const emailToDeptMap = new Map<string, string>();

      list.forEach((item: AddressItem) => {
        if (item.name1 && item.members) {
          const deptName = item.name1.trim();
          let memberList: string[] = [];

          if (Array.isArray(item.members)) {
            memberList = item.members;
          } else if (
            item.members.values &&
            Array.isArray(item.members.values)
          ) {
            memberList = item.members.values;
          }

          memberList.forEach((m) => {
            if (typeof m === "string" && m.includes("@")) {
              emailToDeptMap.set(m.trim().toLowerCase(), deptName);
            }
          });
        }
      });

      // 4. 個人データの抽出と整形（部署名・役職名の自動補完）
      return list
        .map((item: AddressItem): ExtractedPerson => {
          const k1 = (item.nameKana1 || "").trim();
          const k2 = (item.nameKana2 || "").trim();
          const mail = (item.email || "").trim().toLowerCase();

          // 部署名の取得（直接保持が無ければ逆引き）
          let dept = item.department ? item.department.trim() : "";
          if (!dept && mail && emailToDeptMap.has(mail)) {
            dept = emailToDeptMap.get(mail) || "";
          }

          // 役職名の取得（roleId 解析 -> roleMap 参照）
          let pos = item.position ? item.position.trim() : "";
          if (!pos && item.roleId && roleMapObj) {
            const roleNames: string[] = [];
            // カンマ区切り（複数役職）に対応
            const roleIdEntries = item.roleId.split(",");

            roleIdEntries.forEach((entry) => {
              const parts = entry.trim().split("_");
              const singleRoleId = parts[parts.length - 1]; // 末尾の役職IDを取得

              if (singleRoleId && roleMapObj[singleRoleId]) {
                const rObj = roleMapObj[singleRoleId];
                const rName =
                  typeof rObj === "string"
                    ? rObj
                    : rObj.name || rObj.roleName || "";
                if (rName && !roleNames.includes(rName)) {
                  roleNames.push(rName);
                }
              }
            });

            pos = roleNames.join(" / ");
          }

          return {
            nameKana1: k1,
            nameKana2: k2,
            name1: (item.name1 || "").trim(),
            name2: (item.name2 || "").trim(),
            department: dept,
            position: pos,
            email: item.email || "",
            phone: item.phone || "",
          };
        })
        .filter((item: ExtractedPerson) => {
          const hasKana = item.nameKana1 !== "" || item.nameKana2 !== "";
          const hasPosition = item.position !== ""; // 役職が空でない判定を追加
          return (
            hasKana && hasPosition && (item.name1 !== "" || item.email !== "")
          );
        });
    });

    if (!extractedData || extractedData.length === 0) {
      throw new Error(
        "条件に一致する個人アドレスデータが抽出できませんでした。",
      );
    }

    console.log(`🎉 抽出成功: 個人対象データ ${extractedData.length} 件`);

    // ヘッダー（8列: 指定順に変更）
    const headers = [
      "name1",
      "name2",
      "nameKana1",
      "nameKana2",
      "department",
      "position",
      "email",
      "phone",
    ];

    const rows: string[][] = [headers];

    extractedData.forEach((item: ExtractedPerson) => {
      rows.push([
        item.name1,
        item.name2,
        item.nameKana1,
        item.nameKana2,
        item.department,
        item.position,
        item.email,
        item.phone,
      ]);
    });

    console.log(
      `📊 [3/3] Google スプレッドシート（計 ${CONFIG.spreadsheetIds.length} 個の「${CONFIG.targetSheetName}」シート）へ一括更新中...`,
    );

    const auth = await getOAuth2Client();
    const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });

    // 設定された全スプレッドシートIDへ繰り返し出力
    for (const spreadsheetId of CONFIG.spreadsheetIds) {
      console.log(`  └ 更新中 (ID: ${spreadsheetId})...`);

      // A〜H列を対象にクリア＆書き込み
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${CONFIG.targetSheetName}!A:H`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${CONFIG.targetSheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
      });
    }

    console.log("==========================================");
    console.log(
      `🎉 完全自動同期完了: ${CONFIG.spreadsheetIds.length} 個のスプレッドシート「${CONFIG.targetSheetName}」へ ${extractedData.length} 件を出力しました！`,
    );
    console.log("==========================================");
  } catch (error: any) {
    console.error("❌ エラーが発生しました:", error.message || error);
    shouldCloseBrowser = false;
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
})();
