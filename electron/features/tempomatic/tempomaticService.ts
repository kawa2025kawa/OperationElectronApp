//electron\features\tempomatic\tempomaticService.ts

import fs from "node:fs/promises";
import path from "node:path";

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
];

// ============================================================
// Native Cookie Store Client
// ============================================================

class NativeTempomaticClient {
  private cookies: Map<string, string> = new Map();

  private saveCookies(headers: Headers): void {
    const setCookieHeaders = headers.getSetCookie();
    for (const header of setCookieHeaders) {
      const cookiePair = header.split(";")[0];
      if (cookiePair) {
        const [key, ...values] = cookiePair.split("=");
        if (key && values.length > 0) {
          this.cookies.set(key.trim(), values.join("=").trim());
        }
      }
    }
  }

  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  public async get(url: string): Promise<string> {
    const headers: Record<string, string> = {};
    const cookie = this.getCookieHeader();
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(url, { method: "GET", headers });
    this.saveCookies(response.headers);
    return await response.text();
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

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyParams.toString(),
    });
    this.saveCookies(response.headers);
    return await response.text();
  }

  public async postMultipart(url: string, formData: FormData): Promise<string> {
    const headers: Record<string, string> = {};
    const cookie = this.getCookieHeader();
    if (cookie) headers["Cookie"] = cookie;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    this.saveCookies(response.headers);
    return await response.text();
  }
}

// ============================================================
// Helpers
// ============================================================

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getFileName = (filePath: string): string => path.basename(filePath);

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
      "Tempomaticへのログインに失敗しました。認証情報を確認してください。",
    );
  }

  console.log("[Tempomatic] Login succeeded.");
};

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

const createUploadForm = (
  csrf: string,
  filePath: string,
  expireDate: string,
  fileBuffer: Buffer,
): FormData => {
  const fileName = getFileName(filePath);
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

  const blob = new Blob([new Uint8Array(fileBuffer)], {
    type: "application/pdf",
  });
  form.append("pdfFile", blob, fileName);

  return form;
};

const validateFile = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`指定されたファイルがローカルに存在しません: ${filePath}`);
  }
};

const uploadSingleDocument = async (
  client: NativeTempomaticClient,
  filePath: string,
  expireDate: string,
): Promise<void> => {
  await validateFile(filePath);
  const fileName = getFileName(filePath);

  console.log(`[Tempomatic] preparing upload: ${fileName}`);
  const csrf = await getCsrfToken(client);
  const fileBuffer = await fs.readFile(filePath);
  const form = createUploadForm(csrf, filePath, expireDate, fileBuffer);

  const startedAt = Date.now();
  console.log(`[Tempomatic] POST start: ${fileName}`);

  const body = await client.postMultipart(
    `${BASE_URL}/STRLibDocument.do`,
    form,
  );

  const elapsed = Date.now() - startedAt;

  console.log(`[Tempomatic] POST finished: ${fileName} (${elapsed}ms)`);

  if (
    body.includes("loginId") ||
    (!body.includes("登録") && !body.includes("更新"))
  ) {
    console.error(`[Tempomatic] Upload failed: ${fileName}`);
    throw new Error(`ファイルのアップロード処理に失敗しました: ${fileName}`);
  }

  console.log(`[Tempomatic] Upload completed: ${fileName}`);
};

const uploadDocumentsSequentially = async (
  client: NativeTempomaticClient,
  filePaths: string[],
  expireDate: string,
): Promise<void> => {
  for (let index = 0; index < filePaths.length; index += 1) {
    const filePath = filePaths[index];

    if (!filePath) {
      throw new Error(`アップロード対象ファイルが存在しません: index=${index}`);
    }

    const fileName = getFileName(filePath);
    console.log(
      `[Tempomatic] uploading ${index + 1}/${filePaths.length}: ${fileName}`,
    );

    await uploadSingleDocument(client, filePath, expireDate);

    console.log(
      `[Tempomatic] uploaded ${index + 1}/${filePaths.length}: ${fileName}`,
    );

    if (index < filePaths.length - 1) {
      console.log(
        `[Tempomatic] waiting ${UPLOAD_INTERVAL_MS}ms before next upload...`,
      );
      await sleep(UPLOAD_INTERVAL_MS);
    }
  }
};

// ============================================================
// Main Upload API (直接呼出用)
// ============================================================

export async function uploadPdfDocuments(
  filePaths: string[],
  expireDate: string,
): Promise<string> {
  if (!filePaths || filePaths.length === 0) {
    console.error("[Tempomatic] filePaths is empty.");
    throw new Error("アップロードするファイルパスが選択されていません。");
  }

  if (!expireDate) {
    throw new Error("Tempomaticアップロードの有効期限が指定されていません。");
  }

  console.log(
    "[Tempomatic] upload sequence:",
    filePaths.map((filePath, index) => ({
      index: index + 1,
      fileName: getFileName(filePath),
      filePath,
    })),
  );

  const client = new NativeTempomaticClient();
  await loginToTempomatic(client);
  await uploadDocumentsSequentially(client, filePaths, expireDate);

  console.log("[Tempomatic] All documents uploaded successfully.");
  return "正常終了";
}
