import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 設定情報
// ==========================================
const CONFIG = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  spreadsheetId: "1hTWA_tm_l3UmWM1lomiBkhfEQoyKbpofnPJA6DNclsw",
  targetSheetName: "テスト",

  credentialsPath: path.join(
    __dirname,
    "../../resources/google-oauth-credentials.json",
  ),
  tokenPath: path.join(__dirname, "../../resources/token.json"),

  chromeUserDataDir: path.join(__dirname, "../../.chrome-profile"),
};

async function getOAuth2Client() {
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

  const code = await new Promise((resolve) => {
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

(async () => {
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
    const existingPages = await browser.pages();
    const page = await browser.newPage();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    for (const oldPage of existingPages) {
      await oldPage.close().catch(() => {});
    }

    console.log("🔑 アドレス帳ページへ遷移中...");
    await page.goto(CONFIG.addressBookUrl, { waitUntil: "networkidle2" });

    console.log(
      "📦 [2/3] localStorage からデータ抽出および 部署メールアドレスの逆引きマッピング中...",
    );

    const extractedData = await page.evaluate(() => {
      const key = "belc.co.jp/AddressList-1.00/data";
      const rawStr = localStorage.getItem(key);
      if (!rawStr) return [];

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
          list = [];
        }
      }

      if (!Array.isArray(list)) return [];

      // 1. メールアドレス -> 部署名 の逆引きマップを作成
      const emailToDeptMap = new Map();

      list.forEach((item) => {
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
            if (typeof m === "string" && m.includes("@")) {
              emailToDeptMap.set(m.trim().toLowerCase(), deptName);
            }
          });
        }
      });

      // 2. 個人データの抽出と整形（フリガナが存在し、メールまたは名前がある行）
      return list
        .map((item) => {
          const k1 = (item.nameKana1 || "").trim();
          const k2 = (item.nameKana2 || "").trim();
          const mail = (item.email || "").trim().toLowerCase();

          // 逆引きマップから部署名を取得（直接記述の department があればそちらを優先）
          let dept = item.department ? item.department.trim() : "";
          if (!dept && mail && emailToDeptMap.has(mail)) {
            dept = emailToDeptMap.get(mail);
          }

          return {
            nameKana1: k1,
            nameKana2: k2,
            name1: (item.name1 || "").trim(),
            name2: (item.name2 || "").trim(),
            department: dept,
            position: item.position || item.roleName || "",
            email: item.email || "",
            phone: item.phone || "",
          };
        })
        .filter((item) => {
          // 条件: nameKana1 と nameKana2 の両方が空のデータを除外
          const hasKana = item.nameKana1 !== "" || item.nameKana2 !== "";
          return hasKana && (item.name1 !== "" || item.email !== "");
        });
    });

    if (!extractedData || extractedData.length === 0) {
      throw new Error(
        "条件に一致する個人アドレスデータが抽出できませんでした。",
      );
    }

    console.log(`🎉 抽出成功: 個人対象データ ${extractedData.length} 件`);

    const headers = [
      "No.",
      "nameKana1",
      "nameKana2",
      "name1",
      "name2",
      "department",
      "position",
      "email",
      "phone",
    ];

    const rows = [headers];

    extractedData.forEach((item, index) => {
      rows.push([
        index + 1,
        item.nameKana1,
        item.nameKana2,
        item.name1,
        item.name2,
        item.department,
        item.position,
        item.email,
        item.phone,
      ]);
    });

    console.log(
      `📊 [3/3] Google スプレッドシート（${CONFIG.targetSheetName}シート）へ一括更新中...`,
    );

    const auth = await getOAuth2Client();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.targetSheetName}!A:I`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.targetSheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });

    console.log("==========================================");
    console.log(
      `🎉 完全自動同期完了: 「${CONFIG.targetSheetName}」シートへ ${extractedData.length} 件（部署名完全補完済み）を出力しました！`,
    );
    console.log("==========================================");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message || error);
    shouldCloseBrowser = false;
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
})();
