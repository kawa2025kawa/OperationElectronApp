// src/renderer/features/other/services/gmailApiService.ts

import { gmailCommands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";

export interface CreateDraftParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

interface BuildRawMessageParams extends CreateDraftParams {
  from?: string | null;
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);

  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );

  return btoa(binary);
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

function normalizeCrlf(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\r\n");
}

function buildRawMessage({
  from,
  to,
  cc,
  subject,
  body,
}: BuildRawMessageParams): string {
  const isValidFrom =
    typeof from === "string" && from !== "me" && from.includes("@");

  const headers = [
    ...(isValidFrom ? [`From: ${from}`] : []),
    `To: ${to}`,
    ...(cc?.trim() ? [`Cc: ${cc.trim()}`] : []),
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];

  const message = `${headers.join("\r\n")}\r\n\r\n${normalizeCrlf(body)}`;

  return toBase64Url(message);
}

function getUserEmail(): string | null {
  return useAppStore.getState().userEmail ?? null;
}

async function createDraft(params: CreateDraftParams): Promise<void> {
  const raw = buildRawMessage({
    ...params,
    from: getUserEmail(),
  });

  try {
    await gmailCommands.createGmailDraft({
      raw,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "予期せぬエラー";

    throw new Error(`Gmail下書き作成に失敗しました: ${message}`, {
      cause: error,
    });
  }
}

async function getPrimarySignature(): Promise<string> {
  try {
    return await gmailCommands.getGmailSignature();
  } catch (error) {
    console.warn("[gmailApiService] 署名取得に失敗しました", error);

    return "";
  }
}

export const gmailApiService = {
  createDraft,
  getPrimarySignature,
};
