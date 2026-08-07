import { ipcMain } from "electron";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import FormData from "form-data";
import fs from "fs-extra";
import path from "node:path";

const BASE_URL = "https://belc.tempomatic.jp/h2";
const DEFAULT_PUB_GROUP_ID = "a4c0532b-6dc0-446d-bd3f-bb6cbb60aab9";
const DEFAULT_CATEGORIES = [
  "990",
  "1059",
  "1189",
  "1118",
  "926",
  "927",
  "1069",
  "1020",
  "940",
  "1018",
  "1017",
  "928_8",
  "1057",
  "1247",
  "1299",
  "1464",
  "1468",
  "1552",
  "1587",
  "1632",
  "1871",
  "1718",
  "998",
];

export function setupTempomaticHandlers(): void {
  ipcMain.handle(
    "tempomaticUploadDocument",
    async (
      _event,
      args: { filePaths?: string[]; expireDate?: string } | undefined,
    ) => {
      const filePaths = args?.filePaths || [];
      const expireDate = args?.expireDate || "";

      if (!filePaths || filePaths.length === 0) {
        console.error("[Tempomatic] filePaths is empty.");
        throw new Error("アップロードするファイルパスが選択されていません。");
      }

      try {
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true }));

        // 1. ログインリクエスト
        const loginParams = new URLSearchParams();
        loginParams.append("loginId", "98810028");
        loginParams.append("password", "Bog2606!");
        loginParams.append("identity", "");

        const loginRes = await client.post(
          `${BASE_URL}/Login.do`,
          loginParams.toString(),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );

        if (
          typeof loginRes.data === "string" &&
          loginRes.data.includes("loginId")
        ) {
          console.error("[Tempomatic] Login Failed.");
          throw new Error(
            "Tempomaticへのログインに失敗しました。認証情報を確認してください。",
          );
        }

        // 2. アップロード処理
        for (const filePath of filePaths) {
          const exists = await fs.pathExists(filePath);
          if (!exists) {
            console.error(`[Tempomatic] File not found: ${filePath}`);
            throw new Error(
              `指定されたファイルがローカルに存在しません: ${filePath}`,
            );
          }

          const editPageRes = await client.get(
            `${BASE_URL}/STRLibDocument.do?func=edit&ctx=iframe&adding=1`,
          );
          const csrfMatch = String(editPageRes.data).match(
            /name="__CSRF"\s+value="([^"]+)"/,
          );

          if (!csrfMatch || !csrfMatch[1]) {
            console.error("[Tempomatic] CSRF token extraction failed.");
            throw new Error("CSRFトークンの取得に失敗しました。");
          }

          const csrf = csrfMatch[1];
          const fileNameWithExt = path.basename(filePath);
          const docName = path.basename(filePath, path.extname(filePath));
          const fileBuffer = await fs.readFile(filePath);

          const form = new FormData();
          form.append("func", "edit");
          form.append("__CSRF", csrf);
          form.append("docId", "0");
          form.append("ctx", "iframe");
          form.append("name", docName);
          form.append("path", "/");
          form.append("description", "");
          form.append("target", "1");
          form.append("recvAccount", "");
          form.append("fileName", `C:\\fakepath\\${fileNameWithExt}`);
          form.append("pdfFileId", "");
          form.append("videoFileId", "");
          form.append("printPdf", "0");
          form.append("openDate", "");
          form.append("expireDate", expireDate);
          form.append("pubGroupId", DEFAULT_PUB_GROUP_ID);
          DEFAULT_CATEGORIES.forEach((cat) => form.append("category", cat));

          form.append("pdfFile", fileBuffer, {
            filename: fileNameWithExt,
            contentType: "application/pdf",
          });

          const uploadRes = await client.post(
            `${BASE_URL}/STRLibDocument.do`,
            form,
            {
              headers: form.getHeaders(),
            },
          );

          const bodyStr = String(uploadRes.data);

          if (
            bodyStr.includes("loginId") ||
            (!bodyStr.includes("登録") && !bodyStr.includes("更新"))
          ) {
            console.error(`[Tempomatic] Upload failed for ${fileNameWithExt}`);
            throw new Error(
              `ファイルのアップロード処理に失敗しました: ${fileNameWithExt}`,
            );
          }
        }

        return "Tempomatic Upload Success";
      } catch (err) {
        console.error(
          "[Tempomatic] Exception in tempomaticUploadDocument:",
          err,
        );
        throw err;
      }
    },
  );
}
