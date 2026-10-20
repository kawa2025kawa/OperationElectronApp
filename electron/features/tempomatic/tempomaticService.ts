// electron/features/tempomatic/tempomaticService.ts

import fs from "node:fs/promises";
import path from "node:path";
import { net } from "electron";

// ============================================================
// Constants
// ============================================================

const BASE_URL = "https://belc.tempomatic.jp/h2";
const UPLOAD_INTERVAL_MS = 1000;
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
] as const;

// ============================================================
// Native Cookie Store Client (Electron net.fetch 使用)
// ============================================================

class NativeTempomaticClient {
  private cookies = new Map<string, string>();

  private saveCookies(headers: Headers): void {
    const setCookieHeaders = headers.getSetCookie?.() ?? [];
    for (const header of setCookieHeaders) {
      const cookiePair = header.split(";")[0];
      if (!cookiePair) continue;

      const [key, ...values] = cookiePair.split("=");
      if (key && values.length > 0) {
        this.cookies.set(key.trim(), values.join("=").trim());
      }
    }
  }

  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  private async request(
    stage: string,
    url: string,
    init: RequestInit,
  ): Promise<string> {
    const startedAt = Date.now();

    try {
      // 🎯 Electron の net.fetch を使用してネットワーク通信エラー(TypeError: fetch failed)を完全回避
      const response = await net.fetch(url, init);
      this.saveCookies(response.headers);

      console.info(`[Tempomatic] ${stage}`, {
        status: response.status,
        elapsedMs: Date.now() - startedAt,
      });

      if (!response.ok) {
        throw new Error(
          `Tempomatic ${stage}: HTTP ${response.status}${response.statusText}`,
        );
      }

      return await response.text();
    } catch (error) {
      const err = error as Error & {
        cause?: { code?: string; message?: string };
      };

      console.error(`[Tempomatic] ${stage} failed`, {
        host: new URL(url).host,
        path: new URL(url).pathname,
        error: err.message,
        causeCode: err.cause?.code,
        causeMessage: err.cause?.message,
        elapsedMs: Date.now() - startedAt,
      });

      throw error;
    }
  }

  public async get(url: string): Promise<string> {
    const headers: Record<string, string> = {};
    const cookie = this.getCookieHeader();
    if (cookie) headers["Cookie"] = cookie;

    return this.request("GET/CSRF", url, {
      method: "GET",
      headers,
    });
  }

  public async postForm(
    url: string,
    bodyParams: URLSearchParams,
  ): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const cookie = this.getCookieHeader();
    if (cookie) headers["Cookie"] = cookie;

    return this.request("POST/Login", url, {
      method: "POST",
      headers,
      body: bodyParams.toString(),
    });
  }

  public async postMultipart(url: string, formData: FormData): Promise<string> {
    const headers: Record<string, string> = {};
    const cookie = this.getCookieHeader();
    if (cookie) headers["Cookie"] = cookie;

    return this.request("POST/Upload", url, {
      method: "POST",
      headers,
      body: formData,
    });
  }
}

// ============================================================
// Helpers
// ============================================================

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// ============================================================
// Login
// ============================================================

const loginToTempomatic = async (
  client: NativeTempomaticClient,
): Promise<void> => {
  const loginParams = new URLSearchParams();
  loginParams.append("loginId", "98810028");
  loginParams.append("password", "Bog2606!");
  loginParams.append("identity", "");

  const responseText = await client.postForm(
    `${BASE_URL}/Login.do`,
    loginParams,
  );

  if (responseText.includes("loginId")) {
    throw new Error(
      "Tempomaticへのログインに失敗しました。ログイン応答を確認してください。",
    );
  }

  console.info("[Tempomatic] Login response received.");
};

// ============================================================
// CSRF
// ============================================================

const getCsrfToken = async (
  client: NativeTempomaticClient,
): Promise<string> => {
  const responseText = await client.get(
    `${BASE_URL}/STRLibDocument.do?func=edit&ctx=iframe&adding=1`,
  );

  const match = responseText.match(/name="__CSRF"\s+value="([^"]+)"/);

  if (!match?.[1]) {
    throw new Error("CSRFトークンの取得に失敗しました。");
  }

  return match[1];
};

// ============================================================
// Upload Form
// ============================================================

const createUploadForm = (
  csrf: string,
  filePath: string,
  expireDate: string,
  fileBuffer: Buffer,
): FormData => {
  const fileName = path.basename(filePath);
  const documentName = path.basename(filePath, path.extname(filePath));

  const form = new FormData();
  form.append("func", "edit");
  form.append("__CSRF", csrf);
  form.append("docId", "0");
  form.append("ctx", "iframe");
  form.append("name", documentName);
  form.append("path", "/");
  form.append("description", "");
  form.append("target", "1");
  form.append("recvAccount", "");
  form.append("fileName", `C:\\fakepath\\${fileName}`);
  form.append("pdfFileId", "");
  form.append("videoFileId", "");
  form.append("printPdf", "0");
  form.append("openDate", "");
  form.append("expireDate", expireDate);
  form.append("pubGroupId", DEFAULT_PUB_GROUP_ID);

  for (const category of DEFAULT_CATEGORIES) {
    form.append("category", category);
  }

  const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });
  form.append("pdfFile", fileBlob, fileName);

  return form;
};

// ============================================================
// Upload Document
// ============================================================

const uploadSingleDocument = async (
  client: NativeTempomaticClient,
  filePath: string,
  expireDate: string,
): Promise<void> => {
  const fileName = path.basename(filePath);
  const csrf = await getCsrfToken(client);
  const fileBuffer = await fs.readFile(filePath);
  const form = createUploadForm(csrf, filePath, expireDate, fileBuffer);

  const body = await client.postMultipart(
    `${BASE_URL}/STRLibDocument.do`,
    form,
  );

  if (
    body.includes("loginId") ||
    (!body.includes("登録") && !body.includes("更新"))
  ) {
    console.error(`[Tempomatic] Upload failed: ${fileName}`);
    throw new Error(`ファイルのアップロード処理に失敗しました: ${fileName}`);
  }

  console.info(`[Tempomatic] Upload succeeded: ${fileName}`);
};

// ============================================================
// Sequential Upload
// ============================================================

const uploadDocumentsSequentially = async (
  client: NativeTempomaticClient,
  filePaths: readonly string[],
  expireDate: string,
): Promise<void> => {
  for (let index = 0; index < filePaths.length; index += 1) {
    const filePath = filePaths[index];

    await uploadSingleDocument(client, filePath, expireDate);

    if (index < filePaths.length - 1) {
      await sleep(UPLOAD_INTERVAL_MS);
    }
  }
};

// ============================================================
// Main Upload API
// ============================================================

export async function uploadPdfDocuments(
  filePaths: string[],
  expireDate: string,
): Promise<string> {
  if (!filePaths || filePaths.length === 0) {
    throw new Error("アップロードするファイルパスが選択されていません。");
  }

  if (!expireDate) {
    throw new Error("Tempomaticアップロードの有効期限が指定されていません。");
  }

  await Promise.all(
    filePaths.map(async (p) => {
      try {
        await fs.access(p);
      } catch {
        throw new Error(`指定されたファイルがローカルに存在しません: ${p}`);
      }
    }),
  );

  console.info("[Tempomatic] Upload started", {
    fileCount: filePaths.length,
    expireDate,
  });

  const client = new NativeTempomaticClient();

  await loginToTempomatic(client);
  await uploadDocumentsSequentially(client, filePaths, expireDate);

  console.info("[Tempomatic] Upload completed");
  return "正常終了";
}
