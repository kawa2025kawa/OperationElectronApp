// src/renderer/features/other/components/modal/gmailModal/gmailModalUtils.ts

import { getEmailTemplate, type EmailTemplateKey } from "./gmailTemplates";

export interface FormValues {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

/**
 * 直近の火曜日の日付文字列（例: "9月1日"）を取得する
 */
export function getNextTuesdayString(): string {
  const now = new Date();
  const daysUntilNextTuesday = (2 - now.getDay() + 7) % 7 || 7;
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilNextTuesday);
  return `${nextTuesday.getMonth() + 1}月${nextTuesday.getDate()}日`;
}

/**
 * HTML文字列からタグを除去し、プレーンテキストに変換する
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";
  const formattedHtml = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n");
  const doc = new DOMParser().parseFromString(formattedHtml, "text/html");
  const textContent = doc.body.textContent || "";
  return textContent
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 選択されたテンプレートに基づいてフォームの初期値を生成する
 */
export function createFormValues(
  templateKey: EmailTemplateKey | null,
  lastName: string,
  nextTuesdayStr: string,
): FormValues {
  if (!templateKey) return { to: "", cc: "", subject: "", body: "" };
  const template = getEmailTemplate(templateKey);
  return {
    to: template.to,
    cc: template.cc ?? "",
    subject: template.subject,
    body: template.generateBody({ lastName, nextTuesdayStr }),
  };
}

/**
 * 改行やカンマ混在の文字列を Gmail API 送信用（カンマ区切り）に整形する
 */
export function formatEmailAddresses(input: string): string {
  return input
    .split(/[\n,]+/)
    .map((addr) => addr.trim())
    .filter(Boolean)
    .join(", ");
}
