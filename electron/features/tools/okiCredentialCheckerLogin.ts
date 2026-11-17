// electron/features/tools/okiCredentialCheckerLogin.ts

import type { Browser, Page, HTTPResponse } from "puppeteer";

interface LoginOptions {
  loginUrl: string;
  homePath: string;
  selector: string;
  timeout: number;
  userCode: string;
  password: string;
}

interface LoginFormInfo {
  action: string;
  method: string;
}

const USER_CODE_SELECTOR = 'input[name="im_user"]';
const PASSWORD_SELECTOR = 'input[name="im_password"]';
const USER_NAME_SELECTOR = "#imui-user-utility > li > a > span.ui-button-text";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * ログイン画面を表示する
 */
async function openLoginPage(page: Page, options: LoginOptions): Promise<void> {
  await page.goto(options.loginUrl, {
    waitUntil: "domcontentloaded",
    timeout: options.timeout,
  });

  await page.waitForSelector(USER_CODE_SELECTOR, {
    timeout: options.timeout,
  });

  console.log("  ログイン画面: 表示成功");
}

/**
 * ログインフォームの情報を取得する
 */
async function getLoginFormInfo(page: Page): Promise<LoginFormInfo | null> {
  return page.$eval(USER_CODE_SELECTOR, (input) => {
    const form = input.closest("form");

    if (!(form instanceof HTMLFormElement)) {
      return null;
    }

    return {
      action: form.action,
      method: form.method.toUpperCase(),
    };
  });
}

/**
 * 認証情報を入力する
 */
async function enterCredentials(
  page: Page,
  options: LoginOptions,
): Promise<void> {
  await page.type(USER_CODE_SELECTOR, options.userCode);
  await page.type(PASSWORD_SELECTOR, options.password);
}

/**
 * 指定したパスへのレスポンスを待機する
 */
function waitForResponse(
  page: Page,
  method: string,
  pathname: string,
  timeout: number,
): Promise<HTTPResponse> {
  return page.waitForResponse(
    (response) => {
      try {
        return (
          response.request().method() === method &&
          new URL(response.url()).pathname === pathname
        );
      } catch {
        return false;
      }
    },
    { timeout },
  );
}

/**
 * ログインフォームを送信する
 */
async function submitLoginForm(
  page: Page,
  formInfo: LoginFormInfo,
  options: LoginOptions,
): Promise<void> {
  const actionUrl = new URL(formInfo.action, options.loginUrl);

  const postResponsePromise = waitForResponse(
    page,
    formInfo.method,
    actionUrl.pathname,
    options.timeout,
  );

  const homePath = options.homePath.startsWith("/")
    ? options.homePath
    : `/${options.homePath}`;

  const homeResponsePromise = page.waitForResponse(
    (response) => {
      try {
        return (
          response.request().method() === "GET" &&
          new URL(response.url()).pathname.endsWith(homePath)
        );
      } catch {
        return false;
      }
    },
    { timeout: options.timeout },
  );

  // 未取得のレスポンス待機が先にrejectされても未処理Promiseにしない
  void homeResponsePromise.catch(() => undefined);

  await page.$eval(USER_CODE_SELECTOR, (input) => {
    const form = input.closest("form");

    if (!(form instanceof HTMLFormElement)) {
      throw new Error("ログインフォームが見つかりません。");
    }

    form.requestSubmit();
  });

  const postResponse = await postResponsePromise;

  console.log(`  認証POST応答: HTTP ${postResponse.status()}`);

  try {
    const homeResponse = await homeResponsePromise;
    console.log(`  ホーム画面応答: HTTP ${homeResponse.status()}`);
  } catch (error) {
    console.log("  ホーム画面への遷移: 未確認");
    console.log(`  遷移確認エラー: ${getErrorMessage(error)}`);
  }
}

/**
 * ホーム画面の表示状態を確認する
 */
async function logPageStatus(page: Page): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 2000);
  });

  console.log(`  現在のURL: ${page.url()}`);
  console.log(`  ページタイトル: ${await page.title()}`);
}

/**
 * ログイン後のユーザー名を取得する
 */
async function getUserName(page: Page): Promise<string> {
  const count = await page.$$eval(
    USER_NAME_SELECTOR,
    (elements) => elements.length,
  );

  console.log(`  ユーザー名要素件数: ${count}`);

  if (count === 0) {
    console.log("  情報取得: NG");
    return "NG";
  }

  const userName = await page.$eval(
    USER_NAME_SELECTOR,
    (element) => element.textContent?.trim() ?? "",
  );

  if (!userName) {
    console.log("  情報取得: NG");
    return "NG";
  }

  console.log(`  情報取得: 成功`);
  return userName;
}

/**
 * ログインしてユーザー名を取得する
 */
export async function checkLogin(
  browser: Browser,
  options: LoginOptions,
): Promise<string> {
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();

    await openLoginPage(page, options);

    await enterCredentials(page, options);

    const formInfo = await getLoginFormInfo(page);

    if (!formInfo) {
      console.log("  ログインフォーム: 特定できません");
      return "NG";
    }

    console.log(`  ログインフォーム: ${formInfo.method} ${formInfo.action}`);

    await submitLoginForm(page, formInfo, options);

    await logPageStatus(page);

    return await getUserName(page);
  } catch (error) {
    console.log(`  ログイン確認エラー: ${getErrorMessage(error)}`);
    return "NG";
  } finally {
    await context.close();
  }
}
