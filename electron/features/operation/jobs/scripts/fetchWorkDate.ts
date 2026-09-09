import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

interface FetchWorkDateOptions {
  url?: string;
  userId: string;
  password: string;
}

/**
 * ログイン後にヘッダーから業務日付 (YYYY/MM/DD) を取得する
 */
export async function fetchWorkDate(
  options: FetchWorkDateOptions,
): Promise<string> {
  const {
    url = "http://192.88.1.192/belcta/login.php",
    userId,
    password,
  } = options;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. ログイン画面へアクセス
    await page.goto(url, { waitUntil: "networkidle" });

    // 2. IDとパスワードを入力
    await page.fill("#uid", userId);
    await page.fill("#password", password);

    // 3. ログインボタン押下（非推奨の waitForNavigation を廃止し、waitForURL 等で遷移待ち）
    await page.keyboard.press("Enter");

    // 画面遷移完了まで待機（例: login.php から別のページに切り替わる、または DOM 要素が出現するまで待つ）
    await page.waitForLoadState("networkidle");

    // 4. ヘッダーから業務日付の要素テキストを取得
    const headerText = await page.textContent(".heder_date_honsya");

    if (!headerText) {
      throw new Error(
        "ヘッダー要素 (.heder_date_honsya) が見つかりませんでした。",
      );
    }

    // 5. 正規表現で "YYYY/MM/DD" パターンを抽出
    const match = headerText.match(/\d{4}\/\d{2}\/\d{2}/);

    if (!match) {
      throw new Error(
        `業務日付のテキストパターンが見つかりませんでした: ${headerText}`,
      );
    }

    return match[0];
  } finally {
    await browser.close();
  }
}
// ----------------------------------------------------
// 実行用サンプル
// ----------------------------------------------------

async function main() {
  try {
    const workDate = await fetchWorkDate({
      userId: "98810028",
      password: "1560",
    });

    console.log(`取得した業務日付: ${workDate}`);
  } catch (error) {
    console.error("業務日付の取得に失敗しました:", error);
  }
}

// ESM 環境での直接実行判定
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  void main();
}
