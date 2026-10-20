import { chromium, type Browser } from "playwright";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const LOGIN_URL = "http://192.88.1.192/belcta/login.php";
const USER_ID = "98810028";
const PASSWORD = "1560";
const TIMEOUT = 30_000;

export async function runJobN25(): Promise<string> {
  const logger = new JobLogger();
  let browser: Browser | undefined;

  try {
    if (!USER_ID || !PASSWORD) {
      throw new Error(
        "ログイン認証情報が設定されていません。BELCTA_USER_ID / BELCTA_PASSWORD を設定してください。",
      );
    }

    logger.log("業務日付取得処理を開始します");
    logger.log(`ログイン先 : ${LOGIN_URL}`);

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    logger.log("ログイン画面を表示しました");

    await page.locator("#uid").fill(USER_ID);
    await page.locator("#password").fill(PASSWORD);

    await page.locator("#sub2").click({
      timeout: TIMEOUT,
    });

    logger.log("ログイン操作を実行しました");

    const header = page.locator(".heder_date_honsya");

    await header.waitFor({
      state: "visible",
      timeout: TIMEOUT,
    });

    const headerText = await header.textContent();

    if (!headerText) {
      throw new Error("業務日付を取得できませんでした。");
    }

    const match = headerText.match(/\d{4}\/\d{2}\/\d{2}/);

    if (!match) {
      throw new Error("業務日付の形式が見つかりませんでした。");
    }

    const result = `業務日付：${match[0]}`;

    logger.log(result);

    await browser.close();
    browser = undefined;

    return logger.complete(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
