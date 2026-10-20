import { chromium, type Page } from "playwright";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const TOP_URL = "https://www2.belc.co.jp:8002/webedi/belcwebedi.html";
const USER_ID = "09803";
const PASSWORD = "09803";

const getToday = (): string =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "/");

async function executeN31(page: Page): Promise<void> {
  await page.goto(TOP_URL);

  await page.locator("img[name='botan_img1_01']").click();
  await page.locator("#TANTCD").fill(USER_ID);
  await page.locator("#PASSWORD").fill(PASSWORD);
  await page.locator("#submit_btn").click();
  await page.waitForLoadState("networkidle");

  const frame = page.frames().find((item) => item.name() === "contentFrame");

  if (!frame) {
    throw new Error("contentFrame not found");
  }

  await frame.locator("#menu_btn1").click();
  await page.waitForTimeout(2000);

  await frame.locator("#menu_btn9").click();
  await page.waitForTimeout(3000);

  await frame.locator("#HAT_DATE").fill(getToday());
  await frame.locator("#BMN_CD_0").fill("3");

  await frame.evaluate(() => {
    const element = document.querySelector(
      "#SIR_CD_0",
    ) as HTMLInputElement | null;

    if (!element) {
      throw new Error("SIR_CD_0 not found");
    }

    element.value = "029560:";
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.waitForTimeout(1000);
  await frame.locator("#fkey_12").click();
  await page.waitForTimeout(5000);
}

export async function runJobN31(): Promise<string> {
  const logger = new JobLogger();

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    logger.log(`対象URL : ${TOP_URL}`);
    logger.log("WEB-EDI 自動操作を開始します");

    browser = await chromium.launch({
      headless: false,
      channel: "chrome",
    });

    const page = await browser.newPage();

    await executeN31(page);

    logger.log("WEB-EDI の自動操作が完了しました");

    return logger.complete("正常終了");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(`WEB-EDI 操作失敗: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
