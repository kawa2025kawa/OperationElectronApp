// electron/features/gmail/gmailService.ts

import { authService } from "@electron/features/auth/authService";
import { googleApiGetJson } from "@electron/features/auth/googleApiClient";
import type { GenerateDraftTemplateParams } from "@shared/types/electron/ipcTypes";
import { createEmailTemplate } from "./templates/templateFactory";
import {
  buildRawMessage,
  formatEmailAddresses,
  stripHtmlTags,
} from "./gmailUtils";

interface GmailSendAs {
  isPrimary?: boolean;
  signature?: string;
}

interface GmailSendAsResponse {
  sendAs?: GmailSendAs[];
}

const GMAIL_SIGNATURE_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";

const GMAIL_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

/**
- Gmail のプライマリ署名を取得する
 */
export async function fetchPrimarySignature(): Promise<string> {
  try {
    const data =
      await googleApiGetJson<GmailSendAsResponse>(GMAIL_SIGNATURE_URL);
    const primary = data.sendAs?.find((item) => item.isPrimary);

    return primary?.signature ?? "";
  } catch (error) {
    console.error("[GmailService] Failed to fetch signature:", error);
    return "";
  }
}

/**
- メールテンプレートから下書きデータを生成する（担当者姓はMain側セッションから解決）
 */
export async function generateDraftTemplate(
  params: GenerateDraftTemplateParams,
) {
  const { templateKey, links } = params;
  const session = await authService.loadSession();
  const familyName = params.familyName ?? session?.familyName ?? "";

  const draft = createEmailTemplate(templateKey, {
    familyName,
    links,
  });

  const signature = await fetchPrimarySignature();
  const plainSignature = stripHtmlTags(signature);

  if (plainSignature && !draft.body.includes(plainSignature)) {
    const normalizedBody = draft.body.trimEnd();

    draft.body = normalizedBody
      ? `${normalizedBody}\n\n--\n${plainSignature}`
      : `--\n${plainSignature}`;
  }

  return draft;
}

/**
- Gmail に下書きを登録する
 */
export async function createGmailDraft(params: {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  raw?: string;
}): Promise<unknown> {
  let rawMessage = params.raw;

  if (!rawMessage) {
    if (!params.to) {
      throw new Error("宛先 (To) が指定されていません");
    }

    const formattedTo = formatEmailAddresses(params.to);

    if (!formattedTo) {
      throw new Error("有効な宛先 (To) がありません");
    }

    const session = await authService.loadSession();

    rawMessage = buildRawMessage({
      from: session?.email ?? null,
      to: formattedTo,
      cc: formatEmailAddresses(params.cc ?? ""),
      subject: params.subject?.trim() ?? "",
      body: params.body ?? "",
    });
  }

  return googleApiGetJson<unknown>(GMAIL_DRAFT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        raw: rawMessage,
      },
    }),
  });
}
