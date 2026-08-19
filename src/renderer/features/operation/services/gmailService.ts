// src/renderer/features/operation/services/gmailService.ts

import { useAppStore } from "@shared/store";

export interface CreateDraftParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

/**
 * UTF-8 文字列を Base64 に変換する
 *
 * MIME ヘッダー（RFC 2047）の B encoding では
 * 通常の Base64 を使用する。
 */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);

  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * UTF-8 文字列を Base64URL（RFC 4648 §5）形式に変換する。
 *
 * Gmail API の message.raw 全体をエンコードするときに使用する。
 */
function toBase64Url(str: string): string {
  return toBase64(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * RFC 2047 形式で MIME ヘッダーをエンコードする。
 *
 * 重要:
 * MIME ヘッダー内部は Base64URL ではなく通常の Base64 を使用する。
 */
function encodeMimeHeader(text: string): string {
  return `=?UTF-8?B?${toBase64(text)}?=`;
}

/**
 * RFC 2822 / RFC 5322 形式の MIME メッセージを作成し、
 * Gmail API の message.raw 用に Base64URL エンコードする。
 */
function buildRawMessage({
  from,
  to,
  cc,
  subject,
  body,
}: CreateDraftParams & { from: string }): string {
  const messageLines = [`From: ${from}`, `To: ${to}`];

  if (cc && cc.trim().length > 0) {
    messageLines.push(`Cc: ${cc.trim()}`);
  }

  messageLines.push(
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  );

  return toBase64Url(messageLines.join("\r\n"));
}

export const gmailService = {
  /**
   * Main プロセス（IPC）経由で Gmail API の下書きを作成する。
   *
   * Renderer から Gmail API を直接 fetch しないため、
   * Chromium の CORS 制限を受けない。
   */
  async createDraft(params: CreateDraftParams): Promise<void> {
    const { accessToken, userEmail } = useAppStore.getState();

    if (!accessToken) {
      throw new Error(
        "アクセストークンが取得できません。Google再ログインを行ってください。",
      );
    }

    const fromEmail = userEmail || "me";
    const raw = buildRawMessage({
      ...params,
      from: fromEmail,
    });

    if (typeof window.electronAPI?.createGmailDraft !== "function") {
      throw new Error("Electron IPC (createGmailDraft) が利用できません。");
    }

    try {
      await window.electronAPI.createGmailDraft({
        accessToken,
        raw,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gmailの下書き保存に失敗しました: ${error.message}`, {
          cause: error,
        });
      }

      throw new Error("Gmailの下書き保存に失敗しました。", { cause: error });
    }
  },

  /**
   * Main プロセス（IPC）経由で Gmail の署名を取得する。
   */
  async getPrimarySignature(): Promise<string> {
    const { accessToken } = useAppStore.getState();

    if (!accessToken) {
      return "";
    }

    if (typeof window.electronAPI?.getGmailSignature !== "function") {
      console.warn(
        "[GmailService] Electron IPC (getGmailSignature) が利用できません。",
      );
      return "";
    }

    try {
      return await window.electronAPI.getGmailSignature(accessToken);
    } catch (error) {
      console.warn("[GmailService] IPC経由での署名取得に失敗しました:", error);

      return "";
    }
  },
};
