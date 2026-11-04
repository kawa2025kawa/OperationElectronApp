// electron/features/operation/jobs/scripts/nseries/job_n25.ts

import { chromium, type Browser } from "playwright";
import { addDays, format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import type {
  JobResult,
  JobRetryPolicy,
} from "@shared/types/operation/operationTypes";

export interface JobN25ResultData {
  expectedDate: string;
  actualDate: string | null;
  isMatched: boolean;
}

const RETRY_POLICY: JobRetryPolicy = {
  intervalMs: 3 * 60 * 1000,
  timeoutMs: 45 * 60 * 1000,
};

const CONFIG = {
  loginUrl: "http://192.88.1.192/belcta/login.php",
  userId: process.env.BELCTA_USER_ID ?? "",
  password: process.env.BELCTA_PASSWORD ?? "",
  timeout: 30_000,
  selectors: {
    userId: "98810028",
    password: "1560",
    submit: "#sub2",
    headerDate: ".heder_date_honsya",
  },
  dateRegex: /\d{4}\/\d{2}\/\d{2}/,
} as const;

interface RetrySession {
  expectedDate: string;
  expiresAt: number;
}

// 45分間の再試行中は期待日付を固定する。
let retrySession: RetrySession | null = null;

function getExpectedDate(): string {
  if (!retrySession || Date.now() >= retrySession.expiresAt) {
    const startedAt = Date.now();

    retrySession = {
      expectedDate: format(addDays(new Date(startedAt), 1), "yyyy/MM/dd"),
      expiresAt: startedAt + RETRY_POLICY.timeoutMs,
    };
  }

  return retrySession.expectedDate;
}

function clearRetrySession(expectedDate: string): void {
  if (retrySession?.expectedDate === expectedDate) {
    retrySession = null;
  }
}

function createRetryResult(
  logger: JobLogger,
  expectedDate: string,
  summary: string,
  actualDate: string | null = null,
): JobResult {
  const data: JobN25ResultData = {
    expectedDate,
    actualDate,
    isMatched: false,
  };

  return {
    success: true,
    kind: "retrying",
    message: logger.retrying(`${summary} 3分間隔で最大45分間再試行します。`),
    data,
    retryPolicy: RETRY_POLICY,
  };
}

/**
 * ベルク勤怠管理システム（BELCTA）へログインし、業務日付を確認する。
 */
export async function runJobN25(): Promise<JobResult> {
  const logger = new JobLogger();

  if (!CONFIG.userId || !CONFIG.password) {
    throw logger.fail(
      "ログイン認証情報が設定されていません。BELCTA_USER_ID / BELCTA_PASSWORD を設定してください。",
    );
  }

  const expectedDate = getExpectedDate();

  try {
    const result = await fetchAndValidateBusinessDate(expectedDate);

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    return createRetryResult(
      logger,
      expectedDate,
      `業務日付を取得できませんでした${detail}`,
    );
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
 * 取得結果をログに出力し、再試行または正常終了を判定する。
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
    logger.log("NG: 業務日付が翌日日付と一致しません");

    return createRetryResult(
      logger,
      result.expectedDate,
      `業務日付が一致しません。期待値: ${result.expectedDate} / 実際: ${result.actualDate}`,
      result.actualDate,
    );
  }

  clearRetrySession(result.expectedDate);

  return {
    success: true,
    kind: "success",
    message: logger.complete("翌日の業務日付を確認しました"),
    data: result,
  };
}
