// electron/features/operation/jobs/scripts/nseries/job_n31.ts

import { chromium, type Page } from "playwright";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

export interface JobN31ResultData {
  orderDate: string;
  departmentCode: string;
  supplierCode: string;
}

export interface JobN31Selectors {
  readonly entry: string;
  readonly userId: string;
  readonly password: string;
  readonly login: string;
  readonly orderMenu: string;
  readonly orderList: string;
  readonly orderDate: string;
  readonly departmentCode: string;
  readonly supplier: string;
  readonly execute: string;
}

const SELECTORS: JobN31Selectors = {
  entry: "img[name='botan_img1_01']",
  userId: "#TANTCD",
  password: "#PASSWORD",
  login: "#submit_btn",
  orderMenu: "#menu_btn1",
  orderList: "#menu_btn9",
  orderDate: "#HAT_DATE",
  departmentCode: "#BMN_CD_0",
  supplier: "#SIR_CD_0",
  execute: "#fkey_12",
} as const;

const CONFIG = {
  url: "https://www2.belc.co.jp:8002/webedi/belcwebedi.html",
  userId: "09803",
  password: "09803",
  supplierCode: "029560:",
  departmentCode: "3",
  selectors: SELECTORS,
  completionMessage: "正常終了",
} as const;

/**
 * ベルク WEB-EDI にログインし、本日日付の発注一覧照会処理を自動実行する。
 *
 * 接続先:
 * - https://www2.belc.co.jp:8002/webedi/belcwebedi.html
 *
 * 業務上の要対応:
 * - なし（自動操作完了後、正常終了）
 *
 * システムエラー:
 * - ページ遷移失敗
 * - ログイン・メニュー要素操作失敗
 * - 仕入先コード不一致
 */
export async function runJobN31(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await executeWebEdiOrder();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`WEB-EDI操作に失敗しました${detail}`);
  }
}

/**
 * WEB-EDI画面上の仕入先セレクトボックスから指定コードに合致する値を選択する。
 */
async function selectSupplier(page: Page): Promise<void> {
  const supplier = page.locator(CONFIG.selectors.supplier);
  const value = await supplier
    .locator("option")
    .evaluateAll(
      (options, code) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .find((optionValue) => optionValue.startsWith(code as string)) ?? "",
      CONFIG.supplierCode,
    );

  if (!value) {
    throw new Error(
      `仕入先コード ${CONFIG.supplierCode} に一致する選択肢がありません`,
    );
  }

  await supplier.selectOption(value);
}

/**
 * ブラウザを起動し、WEB-EDIの発注操作シーケンスを実行する。
 */
async function executeWebEdiOrder(): Promise<JobN31ResultData> {
  const orderDate = format(new Date(), "yyyy/MM/dd");
  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });

  const page = await browser.newPage();
  const { selectors } = CONFIG;

  await page.goto(CONFIG.url);
  await page.locator(selectors.entry).click();
  await page.locator(selectors.userId).fill(CONFIG.userId);
  await page.locator(selectors.password).fill(CONFIG.password);
  await page.locator(selectors.login).click();
  await page.waitForLoadState("networkidle");

  await page.locator(selectors.orderMenu).click();
  await page.locator(selectors.orderList).click();
  await page.locator(selectors.orderDate).fill(orderDate);
  await page.locator(selectors.departmentCode).fill(CONFIG.departmentCode);

  await selectSupplier(page);

  await page.locator(selectors.execute).click();
  await page.waitForLoadState("networkidle");

  return {
    orderDate,
    departmentCode: CONFIG.departmentCode,
    supplierCode: CONFIG.supplierCode,
  };
}

/**
 * 操作結果をログに出力し、完了メッセージを返却する。
 */
function writeResultLog(logger: JobLogger, result: JobN31ResultData): string {
  logger.section("WEB-EDI 操作情報");
  logger.log(`接続先URL     : ${CONFIG.url}`);
  logger.log(`発注日       : ${result.orderDate}`);
  logger.log(`部門コード   : ${result.departmentCode}`);
  logger.log(`仕入先コード : ${result.supplierCode}`);

  return logger.complete(CONFIG.completionMessage);
}
