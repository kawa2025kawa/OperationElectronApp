import { chromium } from "playwright";

const LOGIN_URL = "http://192.88.1.192/belcta/login.php";

const USER_ID = "98810028";
const PASSWORD = "1560";

const TIMEOUT = 30_000;

/**
 * 業務日付を取得する
 *
 * 戻り値:
 *   業務日付：2026/10/08
 */
export async function runJobN25(): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  try {
    // ログイン画面を表示
    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    // ID・パスワード入力
    await page.locator("#uid").fill(USER_ID);
    await page.locator("#password").fill(PASSWORD);

    // サイト本来のログイン処理を実行
    await page.locator("#sub2").click({
      timeout: TIMEOUT,
    });

    // ログイン後のヘッダーを待機
    const header = page.locator(".heder_date_honsya");

    await header.waitFor({
      state: "visible",
      timeout: TIMEOUT,
    });

    // ヘッダーから業務日付を取得
    const headerText = await header.textContent();

    if (!headerText) {
      throw new Error("業務日付を取得できませんでした。");
    }

    const match = headerText.match(/\d{4}\/\d{2}\/\d{2}/);

    if (!match) {
      throw new Error("業務日付の形式が見つかりませんでした。");
    }

    return `業務日付：${match[0]}`;
  } finally {
    await browser.close();
  }
}
