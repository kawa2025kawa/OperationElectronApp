// electron/features/tools/okiCredentialChecker.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { getOAuth2Client, readSheetValues, writeSheetValues, } from "./okiCredentialCheckerSheets.js";
import { checkLogin } from "./okiCredentialCheckerLogin.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RESOURCES_DIR = path.join(PROJECT_ROOT, "resources");
const CONFIG = {
    loginUrl: "https://oki-corefido-connect.accel-mart.com/imart/login",
    homePath: "/imart/home",
    spreadsheetId: "1XLScmyiEWB-fw-4h5UcwPIFwqFA-POlmdaqWrxgvINs",
    sheetName: "OKI_ID/PW一覧",
    startRow: 3,
    firstProcessRow: 6,
    credentialsPath: path.join(RESOURCES_DIR, "google-oauth-credentials.json"),
    tokenPath: path.join(RESOURCES_DIR, "token.json"),
    selector: "#imui-user-utility > li > a > span.ui-button-text",
    timeout: 20000,
    intervalMs: 1000,
};
const COLUMN = {
    USER_CODE: 2,
    PASSWORD: 3,
    RESULT: 4,
};
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function wait(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
/**
 * 1行分のログイン確認を実行する
 */
async function processRow(browser, rowNumber, row) {
    const userCode = String(row[COLUMN.USER_CODE] ?? "").trim();
    const password = String(row[COLUMN.PASSWORD] ?? "");
    if (!userCode) {
        return "";
    }
    console.log(`${rowNumber}行目: 処理開始`);
    if (!password) {
        console.log(`${rowNumber}行目: NG（パスワードなし）`);
        return "NG";
    }
    const result = await checkLogin(browser, {
        loginUrl: CONFIG.loginUrl,
        homePath: CONFIG.homePath,
        selector: CONFIG.selector,
        timeout: CONFIG.timeout,
        userCode,
        password,
    });
    console.log(`${rowNumber}行目: ${result === "NG" ? "NG" : "取得成功"}`);
    return result;
}
/**
 * メイン処理
 */
async function run() {
    console.log("Google Sheets認証を開始します。");
    const auth = await getOAuth2Client(CONFIG.credentialsPath, CONFIG.tokenPath);
    console.log("A列の最終行までA:Eを取得しています。");
    const sheetData = await readSheetValues(auth, {
        spreadsheetId: CONFIG.spreadsheetId,
        sheetName: CONFIG.sheetName,
        startRow: CONFIG.startRow,
        endColumn: "E",
    });
    const { values, endRow } = sheetData;
    if (values.length === 0) {
        console.log("取得対象データがありません。");
        return;
    }
    console.log(`取得範囲: A${CONFIG.startRow}:E${endRow}`);
    const firstProcessIndex = CONFIG.firstProcessRow - CONFIG.startRow;
    const targetCount = values
        .slice(firstProcessIndex)
        .filter((row) => String(row[COLUMN.USER_CODE] ?? "").trim() !== "").length;
    console.log(`ログイン確認対象: ${targetCount}行`);
    if (targetCount === 0) {
        console.log("C列に処理対象データがありません。");
        return;
    }
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    let processedCount = 0;
    let skippedCount = 0;
    try {
        for (let index = firstProcessIndex; index < values.length; index++) {
            const row = values[index];
            const rowNumber = CONFIG.startRow + index;
            const userCode = String(row[COLUMN.USER_CODE] ?? "").trim();
            if (!userCode) {
                skippedCount++;
                console.log(`${rowNumber}行目: スキップ（C列空欄）`);
                continue;
            }
            try {
                const result = await processRow(browser, rowNumber, row);
                // E列に結果を格納する
                row[COLUMN.RESULT] = result;
            }
            catch (error) {
                console.log(`${rowNumber}行目: 処理エラー - ${getErrorMessage(error)}`);
                // 個別行のエラーはNGとして配列に格納し、後続行を継続する
                row[COLUMN.RESULT] = "NG";
            }
            processedCount++;
            await wait(CONFIG.intervalMs);
        }
    }
    finally {
        await browser.close();
    }
    console.log("Google Sheetsへ配列を一括出力しています。");
    await writeSheetValues(auth, {
        spreadsheetId: CONFIG.spreadsheetId,
        sheetName: CONFIG.sheetName,
        startRow: CONFIG.startRow,
        endRow,
        values,
    });
    console.log("処理が完了しました。");
    console.log(`処理件数: ${processedCount}行`);
    console.log(`スキップ件数: ${skippedCount}行`);
}
void run().catch((error) => {
    console.error("処理エラー:", getErrorMessage(error));
    process.exitCode = 1;
});
