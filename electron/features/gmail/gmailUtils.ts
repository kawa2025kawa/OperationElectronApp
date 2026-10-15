import type { BuildRawMessageParams } from "./gmailTypes";

export function getNextTuesdayString(now: Date = new Date()): string {
  const dayOfWeek = now.getDay();
  const offset = (2 - dayOfWeek + 7) % 7 || 7;

  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offset,
  );

  return `${target.getMonth() + 1}月${target.getDate()}日`;
}

export function getPreviousYearMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);

  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}月`;
}

export function stripHtmlTags(html: string): string {
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

export function formatEmailAddresses(input: string): string {
  if (!input) return "";

  return input
    .split(/[\n,]+/)
    .map((address) => address.trim())
    .filter(Boolean)
    .join(", ");
}

export function formatLinks(links?: Record<string, string> | null): string {
  if (!links) return "";

  return Object.entries(links)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
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

export function buildRawMessage(params: BuildRawMessageParams): string {
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

  const message =
    `${headers.join("\r\n")}\r\n\r\n` + normalizeCrlf(params.body);

  return toBase64Url(message);
}
