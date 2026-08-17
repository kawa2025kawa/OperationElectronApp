// electron/services/operation/jobs/scripts/job_n31.ts
import type { Browser, Frame, Page } from "playwright";

const TOP_URL = "https://www2.belc.co.jp:8002/webedi/belcwebedi.html";
const USER_ID = "09803";
const PASSWORD = "09803";

export async function runJobN31(kanriNo: string): Promise<string> {
  console.log(`[JOB_N31] start ${kanriNo}`);
  const browser = await launchBrowser();
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

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright");
  return chromium.launch({ headless: false, channel: "chrome" });
}

async function executeN31(page: Page): Promise<void> {
  await page.goto(TOP_URL);
  console.log("[JOB_N31] login page loaded");

  await click(page, "img[name='botan_img1_01']");
  await fill(page, "#TANTCD", USER_ID);
  await fill(page, "#PASSWORD", PASSWORD);

  await click(page, "#submit_btn");
  await page.waitForLoadState("networkidle");

  const frame = await getContentFrame(page);
  console.log("[JOB_N31] contentFrame found");

  await click(frame, "#menu_btn1");
  await wait(2000);
  await click(frame, "#menu_btn9");
  await wait(3000);

  await fill(frame, "#HAT_DATE", getToday());
  await fill(frame, "#BMN_CD_0", "3");

  await setSupplierCode(frame);
  await wait(1000);

  await click(frame, "#fkey_12");
  await wait(5000);
  console.log("[JOB_N31] completed");
}

async function click(target: Page | Frame, selector: string): Promise<void> {
  await target.locator(selector).click();
}

async function fill(target: Page | Frame, selector: string, value: string): Promise<void> {
  await target.locator(selector).fill(value);
}

async function getContentFrame(page: Page): Promise<Frame> {
  const frame = page.frames().find((frame) => frame.name() === "contentFrame");
  if (!frame) throw new Error("contentFrame not found");
  return frame;
}

async function setSupplierCode(frame: Frame): Promise<void> {
  await frame.evaluate(() => {
    const element = document.querySelector("#SIR_CD_0") as HTMLInputElement | null;
    if (!element) throw new Error("SIR_CD_0 not found");
    element.value = "029560:";
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getToday(): string {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .replaceAll("-", "/");
}
