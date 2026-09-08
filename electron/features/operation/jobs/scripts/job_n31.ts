// electron/features/operation/jobs/scripts/job_n31.ts
import type { Page } from "playwright";

const TOP_URL = "https://www2.belc.co.jp:8002/webedi/belcwebedi.html";
const USER_ID = "09803";
const PASSWORD = "09803";

const getToday = () =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "/");

export async function runJobN31(kanriNo: string): Promise<string> {
  console.log(`[JOB_N31] start ${kanriNo}`);
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: false, channel: "chrome" });

  try {
    const page = await browser.newPage();
    await executeN31(page);
    return `WEB-EDI 操作完了: ${kanriNo}`;
  } catch (error) {
    console.error("[JOB_N31] failed", error);
    throw error;
  } finally {
    await browser.close();
    console.log("[JOB_N31] browser closed");
  }
}

async function executeN31(page: Page): Promise<void> {
  await page.goto(TOP_URL);
  console.log("[JOB_N31] login page loaded");

  await page.locator("img[name='botan_img1_01']").click();
  await page.locator("#TANTCD").fill(USER_ID);
  await page.locator("#PASSWORD").fill(PASSWORD);
  await page.locator("#submit_btn").click();
  await page.waitForLoadState("networkidle");

  const frame = page.frames().find((f) => f.name() === "contentFrame");
  if (!frame) throw new Error("contentFrame not found");
  console.log("[JOB_N31] contentFrame found");

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
    if (!element) throw new Error("SIR_CD_0 not found");
    element.value = "029560:";
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1000);

  await frame.locator("#fkey_12").click();
  await page.waitForTimeout(5000);
  console.log("[JOB_N31] completed");
}
