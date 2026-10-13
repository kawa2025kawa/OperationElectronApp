// electron/features/gmail/gmailService.ts

import { authService } from "@electron/features/auth/authService";

const GMAIL_SIGNATURE_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";
const GMAIL_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export type EmailTemplateKey = "E8" | "E9" | "E10";

interface GmailSendAs {
  isPrimary?: boolean;
  signature?: string;
}

interface GmailSendAsResponse {
  sendAs?: GmailSendAs[];
}

function getNextTuesdayString(now: Date = new Date()): string {
  const dayOfWeek = now.getDay();
  const offset = (2 - dayOfWeek + 7) % 7 || 7;
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offset,
  );
  return `${target.getMonth() + 1}月${target.getDate()}日`;
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  const formattedHtml = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return formattedHtml
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatEmailAddresses(input: string): string {
  if (!input) return "";
  return input
    .split(/[\n,]+/)
    .map((address) => address.trim())
    .filter(Boolean)
    .join(", ");
}

function getPreviousYearMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`;
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

function buildRawMessage(params: {
  from?: string | null;
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): string {
  const isValidFrom =
    typeof params.from === "string" &&
    params.from !== "me" &&
    params.from.includes("@");
  const headers = [
    ...(isValidFrom ? [`From: ${params.from}`] : []),
    `To: ${params.to}`,
    ...(params.cc?.trim() ? [`Cc: ${params.cc.trim()}`] : []),
    `Subject: ${encodeMimeHeader(params.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  const message = `${headers.join("\r\n")}\r\n\r\n${normalizeCrlf(params.body)}`;
  return toBase64Url(message);
}

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

export async function generateDraftTemplate(params: {
  templateKey: EmailTemplateKey;
  familyName?: string;
  links?: Record<string, string> | null;
}) {
  const { templateKey, familyName = "", links } = params;
  const nextTuesdayStr = getNextTuesdayString();
  const lastName = familyName;

  let draft = { to: "", cc: "", subject: "", body: "" };

  if (templateKey === "E8") {
    let linkText = links
      ? Object.entries(links)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";
    draft = {
      to: "mw-data@tkcc-jp.com",
      cc: "ml-sec-digisui-all@belc.co.jp",
      subject: "データ更新依頼",
      body: `関係者各位\n\nお疲れ様です。${lastName}です。\n\n次回更新日: ${nextTuesdayStr}\n\nよろしくお願いいたします。\n\n${lastName}\nTEL: 049-287-1117${linkText ? `\n\n${linkText}` : ""}`,
    };
  } else if (templateKey === "E9") {
    let linkText = links
      ? Object.entries(links)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";
    draft = {
      to: "belc@taiyosha-insatsu.co.jp",
      cc: "ml-sec-digisui-all@belc.co.jp",
      subject: "POPデータ送信",
      body: linkText,
    };
  } else {
    const ym = getPreviousYearMonth();
    let linkText = links
      ? Object.entries(links)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";
    draft = {
      to: [
        "hassan-a@aeonpeople.biz",
        "taguchi-hisao@aeonpeople.biz",
        "mitamura-to@aeonpeople.biz",
        "takashima-ru@aeonpeople.biz",
        "sasaki-t@aeonpeople.biz",
      ].join("\n"),
      cc: "ml-sec-digisui-all@belc.co.jp",
      subject: `実績報告 (${ym})`,
      body: `関係者各位\n\nお疲れ様です。${lastName}です。\n\n対象年月: ${ym}\n\n${linkText}`,
    };
  }

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

export async function createGmailDraft(params: {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  raw?: string;
}) {
  let rawMessage = params.raw;

  if (!rawMessage) {
    if (!params.to) throw new Error("宛先 (To) が指定されていません");
    const formattedTo = formatEmailAddresses(params.to);
    if (!formattedTo) throw new Error("有効な宛先 (To) がありません");

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw: rawMessage } }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail API Error (${response.status}): ${responseText}`);
  }

  return JSON.parse(responseText);
}
