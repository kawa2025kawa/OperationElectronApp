// electron/features/operation/jobs/scripts/nseries/job_n250.ts

import { chromium, type Browser } from "playwright";
import { addDays, format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { runJobWithLogger } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { getServiceCredentials } from "@electron/features/system/systemService";
import type { JobResult } from "@shared/types/operation/operationTypes";

interface JobN250ResultData {
  loginUrl: string;
  expectedDate: string;
  actualDate: string | null;
  isMatched: boolean;
}

const CONFIG = {
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
- ベルク勤怠管理システム（BELCTA）へログインし、業務日付を確認する。
 */
export async function runJobN250(): Promise<JobResult> {
  console.info(`[N250][Runner] runJobN250開始: ${new Date().toISOString()}`);

  return runJobWithLogger(
    "業務日付の取得・検証に失敗しました",
    async (logger) => {
      const { loginUrl, userId, password } = getServiceCredentials().belcta;

      const expectedDate = format(addDays(new Date(), 1), "yyyy/MM/dd");
      const result = await fetchAndValidateBusinessDate(
        loginUrl,
        userId,
        password,
        expectedDate,
      );

      console.info("[N250][Runner] 業務日付取得結果:", {
        取得日時: new Date().toISOString(),
        期待する翌日: result.expectedDate,
        BELCTA取得日付: result.actualDate,
        一致判定: result.isMatched,
      });

      return writeResultLog(logger, result);
    },
  );
}

async function fetchAndValidateBusinessDate(
  loginUrl: string,
  userId: string,
  password: string,
  expectedDate: string,
): Promise<JobN250ResultData> {
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: CONFIG.timeout,
    });

    await page.locator(CONFIG.selectors.userId).first().fill(userId);
    await page.locator(CONFIG.selectors.password).first().fill(password);
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
      loginUrl,
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

function writeResultLog(
  logger: JobLogger,
  result: JobN250ResultData,
): JobResult {
  logger.section("接続先URL");
  logger.log(result.loginUrl);

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
