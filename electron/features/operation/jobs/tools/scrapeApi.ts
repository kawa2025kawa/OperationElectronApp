// electron/features/operation/jobs/tools/scrapeApi.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type Page, type Dialog } from "puppeteer";
import { google, type sheets_v4 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AppConfig {
  addressBookUrl: string;
  spreadsheetIds: string[];
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

const CONFIG: AppConfig = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  spreadsheetIds: [
    "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    "1DdhzdvH-Z33sK6Zfk8_ZHBqVBmB0MxD9su0NVbge8gI",
  ],
  targetSheetName: "CloudStep",
  credentialsPath: path.join(
    __dirname,
    "../../../../resources/google-oauth-credentials.json",
  ),
  tokenPath: path.join(__dirname, "../../../../resources/token.json"),
  chromeUserDataDir: path.join(__dirname, "../../../../.chrome-profile"),
};

async function getOAuth2Client(): Promise<OAuth2Client> {
  if (!fs.existsSync(CONFIG.credentialsPath)) {
    throw new Error(
      `OAuth Credentials File Not Found: ${CONFIG.credentialsPath}`,
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
  console.log("\nGoogle OAuth URL:\n" + authUrl + "\n");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question("Enter Code: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(CONFIG.tokenPath, JSON.stringify(tokens, null, 2), "utf-8");
  return oAuth2Client;
}

(async (): Promise<void> => {
  console.log("Starting Browser...");
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

    await page.goto(CONFIG.addressBookUrl, { waitUntil: "networkidle2" });

    const extractedData = await page.evaluate((): ExtractedPerson[] => {
      const rawRoleMap = localStorage.getItem(
        "belc.co.jp/AddressList-1.00/roleMap",
      );
      let roleMapObj: Record<string, any> = {};
      if (rawRoleMap) {
        try {
          roleMapObj = JSON.parse(rawRoleMap);
        } catch (e) {}
      }

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

      return list
        .map((item: AddressItem): ExtractedPerson => {
          const k1 = (item.nameKana1 || "").trim();
          const k2 = (item.nameKana2 || "").trim();
          const mail = (item.email || "").trim().toLowerCase();

          let dept = item.department ? item.department.trim() : "";
          if (!dept && mail && emailToDeptMap.has(mail)) {
            dept = emailToDeptMap.get(mail) || "";
          }

          let pos = item.position ? item.position.trim() : "";
          if (!pos && item.roleId && roleMapObj) {
            const roleNames: string[] = [];
            const roleIdEntries = item.roleId.split(",");
            roleIdEntries.forEach((entry) => {
              const parts = entry.trim().split("_");
              const singleRoleId = parts[parts.length - 1];
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
          const hasPosition = item.position !== "";
          return (
            hasKana && hasPosition && (item.name1 !== "" || item.email !== "")
          );
        });
    });

    if (!extractedData || extractedData.length === 0) {
      throw new Error("Extracted Data is empty");
    }

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

    const auth = await getOAuth2Client();
    const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });

    for (const spreadsheetId of CONFIG.spreadsheetIds) {
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
  } catch (error: any) {
    console.error("Scrape Error:", error.message || error);
    shouldCloseBrowser = false;
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
})();
