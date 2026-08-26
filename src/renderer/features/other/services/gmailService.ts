// src/renderer/features/other/services/gmailService.ts

import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";

export interface CreateDraftParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binString);
}

function toBase64Url(value: string): string {
  return toBase64(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${toBase64(value)}?=`;
}

function buildRawMessage({
  from,
  to,
  cc,
  subject,
  body,
}: CreateDraftParams & { from: string }): string {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    ...(cc?.trim() ? [`Cc: ${cc.trim()}`] : []),
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  return toBase64Url(`${headers.join("\r\n")}\r\n\r\n${body}`);
}

export const gmailService = {
  async createDraft(params: CreateDraftParams): Promise<void> {
    const { accessToken, userEmail } = useAppStore.getState();
    if (!accessToken) {
      throw new Error("Googleアカウントのアクセストークンが存在しません。");
    }

    const raw = buildRawMessage({
      ...params,
      from: userEmail || "me",
    });

    try {
      // API側の仕様に合わせて raw 文字列を正しく渡す
      await commands.createGmailDraft({ accessToken, raw });
    } catch (error) {
      const message = error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`Gmail下書き作成失敗: ${message}`, { cause: error });
    }
  },

  async getPrimarySignature(): Promise<string> {
    const { accessToken } = useAppStore.getState();
    if (!accessToken) return "";
    try {
      return await commands.getGmailSignature(accessToken);
    } catch (error) {
      console.warn("[GmailService] 署名取得失敗:", error);
      return "";
    }
  },
};
