// src/renderer/features/operation/services/gmailService.ts

import { useAppStore } from "@shared/store";
import { commands } from "@shared/api/commands";

// =====================================================
// Types
// =====================================================

export interface CreateDraftParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

// =====================================================
// Base64
// =====================================================

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function toBase64Url(value: string): string {
  return toBase64(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// =====================================================
// MIME
// =====================================================

function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${toBase64(value)}?=`;
}

// =====================================================
// Raw Message
// =====================================================

function buildRawMessage({
  from,
  to,
  cc,
  subject,
  body,
}: CreateDraftParams & { from: string }): string {
  const lines = [`From: ${from}`, `To: ${to}`];

  if (cc?.trim()) {
    lines.push(`Cc: ${cc.trim()}`);
  }

  lines.push(
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  );

  return toBase64Url(lines.join("\r\n"));
}

// =====================================================
// Gmail Service
// =====================================================

export const gmailService = {
  async createDraft(params: CreateDraftParams): Promise<void> {
    const { accessToken, userEmail } = useAppStore.getState();

    if (!accessToken) {
      throw new Error(
        "アクセストークンを取得できません。Googleログインを行ってください。",
      );
    }

    const fromEmail = userEmail || "me";

    const raw = buildRawMessage({
      ...params,
      from: fromEmail,
    });

    try {
      await commands.createGmailDraft({
        accessToken,
        raw,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gmailの下書き保存に失敗しました: ${error.message}`, {
          cause: error,
        });
      }

      throw new Error("Gmailの下書き保存に失敗しました。", {
        cause: error,
      });
    }
  },

  async getPrimarySignature(): Promise<string> {
    const { accessToken } = useAppStore.getState();

    if (!accessToken) {
      return "";
    }

    try {
      return await commands.getGmailSignature(accessToken);
    } catch (error) {
      console.warn("[GmailService] Gmail署名の取得に失敗しました:", error);

      return "";
    }
  },
};
