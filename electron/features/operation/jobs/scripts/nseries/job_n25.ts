// electron/features/operation/jobs/scripts/nseries/job_n25.ts

import { chromium, type Browser } from "playwright";
import { addDays, format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import type { JobResult } from "@shared/types/operation/operationTypes";

interface JobN25ResultData {
  expectedDate: string;
  actualDate: string | null;
  isMatched: boolean;
}

const CONFIG = {
  loginUrl: "http://192.88.1.192/belcta/login.php",
  userId: "98810028",
  password: "1560",
  timeout: 30_000,
  selectors: {
    userId: 'input[name="user_id"], #user_id, input[type="text"]',
    password: 'input[name="password"], #password, input[type="password"]',
    submit: "#sub2",
    headerDate: ".heder_date_honsya",
  },
  dateRegex: /\d{4}\/\d{2}\/\d{2}/,
} as const;

/**
 * ベルク勤怠管理システム（BELCTA）へログインし、業務日付を確認する。
 *
 * 監視継続 (running):
 * - 画面上の業務日付がまだ翌日日付になっていない場合（ポーリングによりバックグラウンドで監視を継続）
 *
 * 正常終了 (success):
 * - 画面上の業務日付が翌日日付と一致した場合
 *
 * システムエラー:
 * - ログイン情報未設定
 * - ネットワーク不通、ログイン画面アクセス失敗、DOM要素取得失敗
 */
export async function runJobN25(): Promise<JobResult> {
  console.info(`[N25][Runner] runJobN25開始: ${new Date().toISOString()}`);

  const logger = new JobLogger();

  if (!CONFIG.userId || !CONFIG.password) {
    throw logger.fail(
      "ログイン認証情報が設定されていません。BELCTA_USER_ID / BELCTA_PASSWORD を設定してください。",
    );
  }

  try {
    const expectedDate = format(addDays(new Date(), 1), "yyyy/MM/dd");
    const result = await fetchAndValidateBusinessDate(expectedDate);

    console.info("[N25][Runner] 業務日付取得結果:", {
      取得日時: new Date().toISOString(),
      期待する翌日: result.expectedDate,
      BELCTA取得日付: result.actualDate,
      一致判定: result.isMatched,
    });

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`業務日付の取得・検証に失敗しました${detail}`);
  }
}

/**
 * ブラウザを起動してログインし、画面上の業務日付を取得・照合する。
 */
async function fetchAndValidateBusinessDate(
  expectedDate: string,
): Promise<JobN25ResultData> {
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

    await page.locator(CONFIG.selectors.userId).first().fill(CONFIG.userId);
    await page.locator(CONFIG.selectors.password).first().fill(CONFIG.password);
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
 * 取得結果をログに出力し、JobResult を返却する。
 */
function writeResultLog(
  logger: JobLogger,
  result: JobN25ResultData,
): JobResult {
  logger.section("接続先URL");
  logger.log(CONFIG.loginUrl);

  logger.section("業務日付確認");
  logger.log(`期待業務日付 (翌日) : ${result.expectedDate}`);
  logger.log(`取得業務日付         : ${result.actualDate}`);

  if (!result.isMatched) {
    logger.log("未達: 業務日付がまだ翌日日付になっていません（監視継続）");

    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `業務日付未達 (期待値: ${result.expectedDate} / 実際: ${result.actualDate})。バックグラウンドで監視中`,
      ),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete("翌日の業務日付を確認しました"),
    data: result,
  };
}
