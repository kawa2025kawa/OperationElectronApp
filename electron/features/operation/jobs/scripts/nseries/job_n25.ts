// electron/features/operation/jobs/scripts/nseries/job_n25.ts

import { chromium } from "playwright";

const LOGIN_URL = "http://192.88.1.192/belcta/login.php";
const USER_ID = "98810028";
const PASSWORD = "1560";

/**
 * ログイン後にヘッダーから業務日付 (YYYY/MM/DD) を取得する
 */
export async function runJobN25(): Promise<string> {
  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [JobN25] 業務日付取得`);
  addLine(`==================================================`);
  addLine(`▶ ログインURL: ${LOGIN_URL}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: "networkidle" });

    await page.fill("#uid", USER_ID);
    await page.fill("#password", PASSWORD);
    await page.keyboard.press("Enter");

    await page.waitForLoadState("networkidle");

    const headerText = await page.textContent(".heder_date_honsya");
    if (!headerText) {
      throw new Error(
        "ヘッダー要素 (.heder_date_honsya) が見つかりませんでした。",
      );
    }

    const match = headerText.match(/\d{4}\/\d{2}\/\d{2}/);
    if (!match) {
      throw new Error(
        `業務日付のテキストパターンが見つかりませんでした: ${headerText}`,
      );
    }

    const workDate = match[0];

    addLine(`▶ 取得業務日付: ${workDate}`);
    addLine(`--------------------------------------------------`);
    addLine(` [JobN25] 正常終了`);
    addLine(`==================================================`);

    return outputLines.join("\n");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLine(`❌ 業務日付の取得に失敗しました: ${errorMessage}`);
    addLine(`--------------------------------------------------`);
    throw new Error(`${errorMessage}\n\n${outputLines.join("\n")}`);
  } finally {
    await browser.close();
  }
}
