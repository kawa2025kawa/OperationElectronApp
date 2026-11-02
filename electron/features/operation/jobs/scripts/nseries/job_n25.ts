// electron/features/operation/jobs/scripts/nseries/job_n25.ts

import { chromium, type Browser } from "playwright";
import { addDays, format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  loginUrl: "http://192.88.1.192/belcta/login.php",
  userId: "98810028",
  password: "1560",
  timeout: 30_000,
  selectors: {
    userId: "#uid",
    password: "#password",
    submit: "#sub2",
    headerDate: ".heder_date_honsya",
  },
  dateRegex: /\d{4}\/\d{2}\/\d{2}/,
} as const;

type JobResultData = {
  expectedDate: string;
  actualDate: string;
  isMatched: boolean;
};

/**
 * ベルク勤怠管理システム（BELCTA）へログインし、業務日付が翌日日付と一致するか確認する。
 *
 * 接続先:
 * - http://192.88.1.192/belcta/login.php
 *
 * 業務上の要対応:
 * - 取得した業務日付が期待値（翌日日付）と一致しない場合
 *
 * システムエラー:
 * - 認証情報未設定
 * - ページ遷移・セレクタ取得タイムアウト
 * - 日付テキスト取得・パース失敗
 */
export async function runJobN25(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await fetchAndValidateBusinessDate();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`業務日付取得処理に失敗しました${detail}`);
  }
}

/**
 * ブラウザを起動して勤怠管理システムにログインし、画面上の業務日付を抽出・照合する。
 */
async function fetchAndValidateBusinessDate(): Promise<JobResultData> {
  if (!CONFIG.userId || !CONFIG.password) {
    throw new Error(
      "ログイン認証情報が設定されていません。BELCTA_USER_ID / BELCTA_PASSWORD を設定してください。",
    );
  }

  const expectedDate = format(addDays(new Date(), 1), "yyyy/MM/dd");
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(CONFIG.loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: CONFIG.timeout,
    });

    await page.locator(CONFIG.selectors.userId).fill(CONFIG.userId);
    await page.locator(CONFIG.selectors.password).fill(CONFIG.password);
    await page.locator(CONFIG.selectors.submit).click({
      timeout: CONFIG.timeout,
    });

    const header = page.locator(CONFIG.selectors.headerDate);
    await header.waitFor({
      state: "visible",
      timeout: CONFIG.timeout,
    });

    const headerText = await header.textContent();
    if (!headerText) {
      throw new Error("業務日付を取得できませんでした。");
    }

    const match = headerText.match(CONFIG.dateRegex);
    if (!match) {
      throw new Error("業務日付の形式が見つかりませんでした。");
    }

    const actualDate = match[0];

    return {
      expectedDate,
      actualDate,
      isMatched: actualDate === expectedDate,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

/**
 * 取得結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("接続先URL");
  logger.log(CONFIG.loginUrl);

  logger.section("業務日付確認");
  logger.log(`期待業務日付 (翌日) : ${result.expectedDate}`);
  logger.log(`取得業務日付        : ${result.actualDate}`);

  if (!result.isMatched) {
    logger.log("NG: 業務日付が翌日日付と一致しません");

    return logger.needsAction(
      `業務日付要確認 (期待値: ${result.expectedDate}, 実際: ${result.actualDate})`,
    );
  }

  return logger.complete();
}
