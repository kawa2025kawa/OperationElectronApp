// electron/features/tempomatic/tempomaticService.ts

import fs from "node:fs/promises";
import path from "node:path";
import { addDays, format } from "date-fns";
import { net } from "electron";
import { getServiceCredentials } from "@electron/features/system/serviceCredentialsLoader";
import {
  IPC_CHANNELS,
  type IpcChannelMap,
  type TempomaticUploadTargetFile,
} from "@shared/types/electron/ipcTypes";

// ============================================================
// Types
// ============================================================

export type TempomaticTargetFile = TempomaticUploadTargetFile;
type TempomaticUploadInput =
  IpcChannelMap[typeof IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT]["args"][0];

const TEMPOMATIC_DEFAULT_CATEGORIES = [
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
// Constants
// ============================================================

const TEMPOMATIC_CONFIG = {
  uploadIntervalMs: 1000,
  defaultExpireOffsetDays: 7,
  defaultPubGroupId: "a4c0532b-6dc0-446d-bd3f-bb6cbb60aab9",
  defaultCategories: TEMPOMATIC_DEFAULT_CATEGORIES,
} as const;

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
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };
    const cookie = this.getCookieHeader();
    if (cookie) {
      headers["Cookie"] = cookie;
    }

    try {
      const response = await net.fetch(url, { ...init, headers });
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

  public get(url: string): Promise<string> {
    return this.request("GET/CSRF", url, { method: "GET" });
  }

  public postForm(url: string, bodyParams: URLSearchParams): Promise<string> {
    return this.request("POST/Login", url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });
  }

  public postMultipart(url: string, formData: FormData): Promise<string> {
    return this.request("POST/Upload", url, {
      method: "POST",
      body: formData,
    });
  }
}

// ============================================================
// Helpers
// ============================================================

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function calculateDefaultExpireDate(
  offsetDays: number = TEMPOMATIC_CONFIG.defaultExpireOffsetDays,
): string {
  return format(addDays(new Date(), offsetDays), "yyyy/MM/dd");
}

function normalizeTargetFiles(
  params: TempomaticUploadInput,
): TempomaticTargetFile[] {
  const rawList: TempomaticTargetFile[] =
    params.files ?? params.filePaths?.map((p: string) => ({ path: p })) ?? [];
  const visited = new Set<string>();
  const targets: TempomaticTargetFile[] = [];

  for (const item of rawList) {
    const filePath = item.path?.trim();
    if (!filePath || visited.has(filePath)) continue;
    visited.add(filePath);

    if (filePath.toLowerCase().endsWith(".pdf")) {
      targets.push({
        path: filePath,
        name: item.name?.trim(),
      });
    }
  }

  return targets;
}

// ============================================================
// Login
// ============================================================

const loginToTempomatic = async (
  client: NativeTempomaticClient,
  baseUrl: string,
  loginId: string,
  password: string,
): Promise<void> => {
  const loginParams = new URLSearchParams();
  loginParams.append("loginId", loginId);
  loginParams.append("password", password);
  loginParams.append("identity", "");

  const responseText = await client.postForm(
    `${baseUrl}/Login.do`,
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
  baseUrl: string,
): Promise<string> => {
  const responseText = await client.get(
    `${baseUrl}/STRLibDocument.do?func=edit&ctx=iframe&adding=1`,
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
  target: TempomaticTargetFile,
  expireDate: string,
  fileBuffer: Buffer,
): FormData => {
  const resolvedFileName = target.name?.trim() || path.basename(target.path);
  const documentName = path.basename(
    resolvedFileName,
    path.extname(resolvedFileName),
  );

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
  form.append("fileName", `C:\\fakepath\\${resolvedFileName}`);
  form.append("pdfFileId", "");
  form.append("videoFileId", "");
  form.append("printPdf", "0");
  form.append("openDate", "");
  form.append("expireDate", expireDate);
  form.append("pubGroupId", TEMPOMATIC_CONFIG.defaultPubGroupId);

  for (const category of TEMPOMATIC_CONFIG.defaultCategories) {
    form.append("category", category);
  }

  const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
    type: "application/pdf",
  });
  form.append("pdfFile", fileBlob, resolvedFileName);

  return form;
};

// ============================================================
// Upload Document
// ============================================================

const uploadSingleDocument = async (
  client: NativeTempomaticClient,
  baseUrl: string,
  target: TempomaticTargetFile,
  expireDate: string,
): Promise<void> => {
  const displayName = target.name || path.basename(target.path);
  const csrf = await getCsrfToken(client, baseUrl);
  const fileBuffer = await fs.readFile(target.path);
  const form = createUploadForm(csrf, target, expireDate, fileBuffer);

  const body = await client.postMultipart(
    `${baseUrl}/STRLibDocument.do`,
    form,
  );

  if (
    body.includes("loginId") ||
    (!body.includes("登録") && !body.includes("更新"))
  ) {
    console.error(`[Tempomatic] Upload failed: ${displayName}`);
    throw new Error(`ファイルのアップロード処理に失敗しました: ${displayName}`);
  }

  console.info(`[Tempomatic] Upload succeeded: ${displayName}`);
};

// ============================================================
// Sequential Upload
// ============================================================

const uploadDocumentsSequentially = async (
  client: NativeTempomaticClient,
  baseUrl: string,
  targets: readonly TempomaticTargetFile[],
  expireDate: string,
): Promise<void> => {
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    if (!target) continue;

    await uploadSingleDocument(client, baseUrl, target, expireDate);

    if (index < targets.length - 1) {
      await sleep(TEMPOMATIC_CONFIG.uploadIntervalMs);
    }
  }
};

// ============================================================
// Main Upload API
// ============================================================

export async function uploadPdfDocuments(
  targets: TempomaticTargetFile[],
  expireDate: string,
): Promise<string> {
  if (!targets || targets.length === 0) {
    throw new Error("アップロードするファイルが選択されていません。");
  }

  if (!expireDate) {
    throw new Error("Tempomaticアップロードの有効期限が指定されていません。");
  }

  await Promise.all(
    targets.map(async (t) => {
      try {
        await fs.access(t.path);
      } catch {
        throw new Error(
          `指定されたファイルが存在しません: ${path.basename(t.path)}`,
        );
      }
    }),
  );

  const { baseUrl, loginId, password } = getServiceCredentials().tempomatic;

  console.info("[Tempomatic] Upload started", {
    fileCount: targets.length,
    expireDate,
  });

  const client = new NativeTempomaticClient();

  await loginToTempomatic(client, baseUrl, loginId, password);
  await uploadDocumentsSequentially(client, baseUrl, targets, expireDate);

  console.info("[Tempomatic] Upload completed");
  return "正常終了";
}

export async function uploadTempomaticDocuments(
  params: TempomaticUploadInput,
): Promise<string> {
  const targets = normalizeTargetFiles(params);
  if (targets.length === 0) {
    throw new Error(
      "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
    );
  }

  const expireDate =
    params.expireDate?.trim() || calculateDefaultExpireDate();
  return uploadPdfDocuments(targets, expireDate);
}
