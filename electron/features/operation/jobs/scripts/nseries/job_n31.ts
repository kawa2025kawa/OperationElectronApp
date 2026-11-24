// electron/features/operation/jobs/scripts/nseries/job_n31.ts

import { chromium, type Page } from "playwright";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { runJobWithLogger } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";
import { getServiceCredentials } from "@electron/features/system/serviceCredentialsLoader";

interface JobN31ResultData {
  url: string;
  orderDate: string;
  departmentCode: string;
  supplierCode: string;
}

interface JobN31Selectors {
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
  supplierCode: "029560:",
  departmentCode: "3",
  selectors: SELECTORS,
  completionMessage: "正常終了",
} as const;

/**
- ベルク WEB-EDI にログインし、本日日付の発注一覧照会処理を自動実行する。
 */
export async function runJobN31(): Promise<string> {
  return runJobWithLogger("WEB-EDI操作に失敗しました", async (logger) => {
    const result = await executeWebEdiOrder();
    return writeResultLog(logger, result);
  });
}

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

async function executeWebEdiOrder(): Promise<JobN31ResultData> {
  const { url, userId, password } = getServiceCredentials().webedi;
  const orderDate = getDateKey(new Date(), "yyyy/MM/dd");
  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });

  const page = await browser.newPage();
  const { selectors } = CONFIG;

  await page.goto(url);
  await page.locator(selectors.entry).click();
  await page.locator(selectors.userId).fill(userId);
  await page.locator(selectors.password).fill(password);
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
    url,
    orderDate,
    departmentCode: CONFIG.departmentCode,
    supplierCode: CONFIG.supplierCode,
  };
}

function writeResultLog(logger: JobLogger, result: JobN31ResultData): string {
  logger.section("WEB-EDI 操作情報");
  logger.log(`接続先URL      : ${result.url}`);
  logger.log(`発注日        : ${result.orderDate}`);
  logger.log(`部門コード    : ${result.departmentCode}`);
  logger.log(`仕入先コード : ${result.supplierCode}`);

  return logger.complete(CONFIG.completionMessage);
}