import { authService } from "@electron/features/auth/authService";

import type {
  EmailTemplateKey,
  GenerateDraftTemplateParams,
  GmailSendAsResponse,
} from "./gmailTypes";

import { createEmailTemplate } from "./templates";
import {
  buildRawMessage,
  formatEmailAddresses,
  stripHtmlTags,
} from "./gmailUtils";

const GMAIL_SIGNATURE_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";

const GMAIL_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

/**
 * Gmail のプライマリ署名を取得する
 */
export async function fetchPrimarySignature(): Promise<string> {
  try {
    const response = await authService.request(GMAIL_SIGNATURE_URL);

    if (!response.ok) return "";

    const data = (await response.json()) as GmailSendAsResponse;
    const primary = data.sendAs?.find((item) => item.isPrimary);

    return primary?.signature ?? "";
  } catch (error) {
    console.error("[GmailService] Failed to fetch signature:", error);
    return "";
  }
}

/**
 * メールテンプレートから下書きデータを生成する
 */
export async function generateDraftTemplate(
  params: GenerateDraftTemplateParams,
) {
  const { templateKey, familyName = "", links } = params;

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
 * Gmail に下書きを登録する
 */
export async function createGmailDraft(params: {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  raw?: string;
}) {
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

  const response = await authService.request(GMAIL_DRAFT_URL, {
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

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Gmail API Error (${response.status}): ${responseText}`);
  }

  return JSON.parse(responseText);
}
