// electron/features/operation/jobs/tools/scrapeApi.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type Page, type Dialog } from "puppeteer";
import { google, type sheets_v4 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "../../../../../");
const RESOURCES_DIR = path.join(PROJECT_ROOT, "resources");

const SPREADSHEET_HEADERS = [
  "name1",
  "name2",
  "nameKana1",
  "nameKana2",
  "department",
  "position",
  "email",
  "phone",
] as const;

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

interface OAuthCredentialsFile {
  installed?: OAuthClientConfig;
  web?: OAuthClientConfig;
}

interface OAuthClientConfig {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
}

interface BrowserWindow extends Window {
  decompress?: (value: string) => unknown;
  AddressList?: {
    data?: unknown;
  };
}

const CONFIG: AppConfig = {
  addressBookUrl: "https://cloudstep-ab.appspot.com/a/belc.co.jp/v2/ab",
  spreadsheetIds: [
    "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    "1DdhzdvH-Z33sK6Zfk8_ZHBqVBmB0MxD9su0NVbge8gI",
  ],
  targetSheetName: "CloudStep",
  credentialsPath: path.join(RESOURCES_DIR, "google-oauth-credentials.json"),
  tokenPath: path.join(RESOURCES_DIR, "token.json"),
  chromeUserDataDir: path.join(PROJECT_ROOT, ".chrome-profile"),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOAuthCredentials(value: unknown): OAuthClientConfig {
  if (!isRecord(value)) {
    throw new Error("OAuth Credentials File Format Is Invalid");
  }

  const config: OAuthCredentialsFile = {
    installed: isRecord(value.installed)
      ? (value.installed as unknown as OAuthClientConfig)
      : undefined,
    web: isRecord(value.web)
      ? (value.web as unknown as OAuthClientConfig)
      : undefined,
  };

  const client = config.installed ?? config.web;

  if (
    !client ||
    typeof client.client_id !== "string" ||
    typeof client.client_secret !== "string"
  ) {
    throw new Error("OAuth Client Credentials Are Invalid");
  }

  if (
    client.redirect_uris !== undefined &&
    (!Array.isArray(client.redirect_uris) ||
      !client.redirect_uris.every(
        (uri: unknown): uri is string => typeof uri === "string",
      ))
  ) {
    throw new Error("OAuth Redirect URIs Are Invalid");
  }

  return client;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function getOAuth2Client(): Promise<OAuth2Client> {
  if (!fs.existsSync(CONFIG.credentialsPath)) {
    throw new Error(
      `OAuth Credentials File Not Found: ${CONFIG.credentialsPath}`,
    );
  }

  const credentialsContent = fs.readFileSync(CONFIG.credentialsPath, "utf-8");
  const credentials = parseOAuthCredentials(
    JSON.parse(credentialsContent) as unknown,
  );

  const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris?.[0] ?? "http://localhost",
  );

  if (fs.existsSync(CONFIG.tokenPath)) {
    const tokenContent = fs.readFileSync(CONFIG.tokenPath, "utf-8");
    const token: unknown = JSON.parse(tokenContent);

    if (!isRecord(token)) {
      throw new Error("OAuth Token File Format Is Invalid");
    }

    oAuth2Client.setCredentials(
      token as Parameters<OAuth2Client["setCredentials"]>[0],
    );

    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  console.log("\nGoogle OAuth URL:\n" + authUrl + "\n");

  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question("Enter Code: ", (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);

  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(CONFIG.tokenPath, JSON.stringify(tokens, null, 2), "utf-8");

  return oAuth2Client;
}

async function closePageSafely(page: Page): Promise<void> {
  try {
    await page.close();
  } catch (error: unknown) {
    console.warn(
      "Failed to close existing browser page:",
      getErrorMessage(error),
    );
  }
}

async function extractAddressBook(page: Page): Promise<ExtractedPerson[]> {
  return page.evaluate((): ExtractedPerson[] => {
    const rawRoleMap = localStorage.getItem(
      "belc.co.jp/AddressList-1.00/roleMap",
    );

    let roleMap: Record<string, unknown> = {};

    if (rawRoleMap) {
      try {
        const parsed: unknown = JSON.parse(rawRoleMap);

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          roleMap = parsed as Record<string, unknown>;
        }
      } catch {
        roleMap = {};
      }
    }

    const rawData = localStorage.getItem("belc.co.jp/AddressList-1.00/data");

    if (!rawData) {
      return [];
    }

    const browserWindow = window as BrowserWindow;
    let parsedData: unknown;

    if (typeof browserWindow.decompress === "function") {
      parsedData = browserWindow.decompress(rawData);
    } else if (browserWindow.AddressList?.data !== undefined) {
      parsedData = browserWindow.AddressList.data;
    } else {
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(parsedData)) {
      return [];
    }

    const items = parsedData.filter(
      (item: unknown): item is AddressItem =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    );

    const emailToDepartment = new Map<string, string>();

    items.forEach((item: AddressItem) => {
      if (typeof item.name1 !== "string" || !item.members) {
        return;
      }

      const department = item.name1.trim();

      const members = Array.isArray(item.members)
        ? item.members
        : Array.isArray(item.members.values)
          ? item.members.values
          : [];

      members.forEach((member: string) => {
        if (typeof member === "string" && member.includes("@")) {
          emailToDepartment.set(member.trim().toLowerCase(), department);
        }
      });
    });

    return items
      .map((item: AddressItem): ExtractedPerson => {
        const nameKana1 =
          typeof item.nameKana1 === "string" ? item.nameKana1.trim() : "";
        const nameKana2 =
          typeof item.nameKana2 === "string" ? item.nameKana2.trim() : "";
        const email = typeof item.email === "string" ? item.email : "";
        const normalizedEmail = email.trim().toLowerCase();

        let department =
          typeof item.department === "string" ? item.department.trim() : "";

        if (!department && normalizedEmail) {
          department = emailToDepartment.get(normalizedEmail) ?? "";
        }

        let position =
          typeof item.position === "string" ? item.position.trim() : "";

        if (!position && typeof item.roleId === "string") {
          const roleNames: string[] = [];

          item.roleId.split(",").forEach((entry: string) => {
            const parts = entry.trim().split("_");
            const roleId = parts[parts.length - 1];

            if (!roleId) {
              return;
            }

            const role = roleMap[roleId];
            let roleName = "";

            if (typeof role === "string") {
              roleName = role;
            } else if (
              typeof role === "object" &&
              role !== null &&
              !Array.isArray(role)
            ) {
              const roleRecord = role as Record<string, unknown>;

              if (typeof roleRecord.name === "string") {
                roleName = roleRecord.name;
              } else if (typeof roleRecord.roleName === "string") {
                roleName = roleRecord.roleName;
              }
            }

            if (roleName && !roleNames.includes(roleName)) {
              roleNames.push(roleName);
            }
          });

          position = roleNames.join(" / ");
        }

        return {
          nameKana1,
          nameKana2,
          name1: typeof item.name1 === "string" ? item.name1.trim() : "",
          name2: typeof item.name2 === "string" ? item.name2.trim() : "",
          department,
          position,
          email,
          phone: typeof item.phone === "string" ? item.phone : "",
        };
      })
      .filter(
        (item: ExtractedPerson) =>
          (item.nameKana1 !== "" || item.nameKana2 !== "") &&
          item.position !== "" &&
          (item.name1 !== "" || item.email !== ""),
      );
  });
}

function createSpreadsheetRows(people: ExtractedPerson[]): string[][] {
  return [
    [...SPREADSHEET_HEADERS],
    ...people.map((person: ExtractedPerson) => [
      person.name1,
      person.name2,
      person.nameKana1,
      person.nameKana2,
      person.department,
      person.position,
      person.email,
      person.phone,
    ]),
  ];
}

async function updateSpreadsheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  rows: string[][],
): Promise<void> {
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

async function runScrape(): Promise<void> {
  console.log("Starting Browser...");

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: CONFIG.chromeUserDataDir,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let shouldCloseBrowser = true;

  try {
    const existingPages = await browser.pages();
    const page = await browser.newPage();

    page.on("dialog", async (dialog: Dialog) => {
      await dialog.accept();
    });

    await Promise.all(existingPages.map(closePageSafely));

    await page.goto(CONFIG.addressBookUrl, {
      waitUntil: "networkidle2",
    });

    const extractedData = await extractAddressBook(page);

    if (extractedData.length === 0) {
      throw new Error("Extracted Data is empty");
    }

    const rows = createSpreadsheetRows(extractedData);
    const auth = await getOAuth2Client();
    const sheets = google.sheets({ version: "v4", auth });

    for (const spreadsheetId of CONFIG.spreadsheetIds) {
      await updateSpreadsheet(sheets, spreadsheetId, rows);
    }

    console.log(`Scrape completed: ${extractedData.length} records`);
  } catch (error: unknown) {
    console.error("Scrape Error:", getErrorMessage(error));
    shouldCloseBrowser = false;
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
}

void runScrape().catch((error: unknown) => {
  console.error("Scrape Error:", getErrorMessage(error));
  process.exitCode = 1;
});
