// electron/features/operation/jobs/scripts/nseries/job_n31.ts

import { chromium, type Page } from "playwright";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  url: "https://www2.belc.co.jp:8002/webedi/belcwebedi.html",
  userId: "09803",
  password: "09803",
  supplierCode: "029560:",
  departmentCode: "3",
  selectors: {
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
  },
} as const;

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
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

async function executeN31(page: Page): Promise<void> {
  const { selectors } = CONFIG;

  await page.goto(CONFIG.url);
  await page.locator(selectors.entry).click();
  await page.locator(selectors.userId).fill(CONFIG.userId);
  await page.locator(selectors.password).fill(CONFIG.password);
  await page.locator(selectors.login).click();
  await page.waitForLoadState("networkidle");

  await page.locator(selectors.orderMenu).click();
  await page.locator(selectors.orderList).click();
  await page.locator(selectors.orderDate).fill(getToday());
  await page.locator(selectors.departmentCode).fill(CONFIG.departmentCode);

  await selectSupplier(page);

  await page.locator(selectors.execute).click();
  await page.waitForLoadState("networkidle");
}

export async function runJobN31(): Promise<string> {
  const logger = new JobLogger();

  try {
    logger.log(`対象URL : ${CONFIG.url}`);
    logger.log("WEB-EDI 自動操作を開始します");

    const browser = await chromium.launch({
      headless: false,
      channel: "chrome",
    });

    await executeN31(await browser.newPage());

    logger.log("WEB-EDI の自動操作が完了しました");
    return logger.complete("正常終了");
  } catch (error: unknown) {
    throw logger.fail(
      `WEB-EDI 操作失敗: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
