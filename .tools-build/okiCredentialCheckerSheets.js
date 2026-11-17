// electron/features/tools/okiCredentialCheckerSheets.ts
import fs from "node:fs";
import readline from "node:readline";
import { google } from "googleapis";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseOAuthCredentials(value) {
    if (!isRecord(value)) {
        throw new Error("Google OAuth Credentialsの形式が不正です。");
    }
    const client = isRecord(value.installed)
        ? value.installed
        : isRecord(value.web)
            ? value.web
            : undefined;
    if (!client ||
        typeof client.client_id !== "string" ||
        typeof client.client_secret !== "string") {
        throw new Error("Google OAuth Credentialsが不正です。");
    }
    return {
        client_id: client.client_id,
        client_secret: client.client_secret,
        redirect_uris: Array.isArray(client.redirect_uris)
            ? client.redirect_uris.filter((uri) => typeof uri === "string")
            : undefined,
    };
}
function createSheetsClient(auth) {
    return google.sheets({
        version: "v4",
        auth,
    });
}
/**
 * Google OAuthクライアントを取得する
 */
export async function getOAuth2Client(credentialsPath, tokenPath) {
    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`OAuth Credentialsが見つかりません: ${credentialsPath}`);
    }
    const credentials = parseOAuthCredentials(JSON.parse(fs.readFileSync(credentialsPath, "utf-8")));
    const client = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uris?.[0] ?? "http://localhost");
    if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
        if (!isRecord(token)) {
            throw new Error("Google OAuth Tokenの形式が不正です。");
        }
        client.setCredentials(token);
        return client;
    }
    const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    console.log("\nGoogle OAuth URL:\n");
    console.log(authUrl);
    console.log("");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const code = await new Promise((resolve) => {
        rl.question("Google OAuth Code: ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), "utf-8");
    return client;
}
/**
 * A列の最終データ行までA:Eを一括取得する
 *
 * 取得結果:
 * - values[0] がシート3行目
 * - values[3] がシート6行目
 */
export async function readSheetValues(auth, options) {
    const sheets = createSheetsClient(auth);
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: options.spreadsheetId,
        range: `'${options.sheetName}'!A${options.startRow}:${options.endColumn}`,
        valueRenderOption: "FORMULA",
    });
    const sourceValues = response.data.values ?? [];
    // A列に値がある最後の配列位置を取得する
    let lastIndex = -1;
    for (let index = sourceValues.length - 1; index >= 0; index--) {
        const value = String(sourceValues[index]?.[0] ?? "").trim();
        if (value !== "") {
            lastIndex = index;
            break;
        }
    }
    if (lastIndex === -1) {
        return {
            values: [],
            endRow: options.startRow - 1,
        };
    }
    const values = sourceValues
        .slice(0, lastIndex + 1)
        .map((row) => Array.from({ length: 5 }, (_, index) => String(row[index] ?? "")));
    return {
        values,
        endRow: options.startRow + lastIndex,
    };
}
/**
 * A:Eの配列を一括出力する
 */
export async function writeSheetValues(auth, options) {
    if (options.values.length === 0 || options.endRow < options.startRow) {
        console.log("書き込み対象データがありません。");
        return;
    }
    const sheets = createSheetsClient(auth);
    await sheets.spreadsheets.values.update({
        spreadsheetId: options.spreadsheetId,
        range: `'${options.sheetName}'!A${options.startRow}:E${options.endRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: options.values,
        },
    });
    console.log(`一括書き込み完了: A${options.startRow}:E${options.endRow}`);
}
