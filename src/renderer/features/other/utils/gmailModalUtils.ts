// src/renderer/features/other/utils/gmailModalUtils.ts

/**
 * 次回火曜日の日付文字列 (M月D日) を返却するユーティリティ
 */
export function getNextTuesdayString(now: Date = new Date()): string {
  const dayOfWeek = now.getDay();
  const offset = (2 - dayOfWeek + 7) % 7 || 7;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);

  return `${target.getMonth() + 1}月${target.getDate()}日`;
}

/**
 * HTML文字列からタグを除去しプレーンテキストを抽出するユーティリティ
 */
export function stripHtmlTags(html: string): string {
  if (!html) {
    return "";
  }

  const formattedHtml = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n");

  const doc = new DOMParser().parseFromString(formattedHtml, "text/html");
  const rawText = doc.body.textContent || "";

  return rawText
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 改行・カンマ区切りの文字列を正規化されたメールアドレス一覧に結合するユーティリティ
 */
export function formatEmailAddresses(input: string): string {
  if (!input) {
    return "";
  }

  return input
    .split(/[\n,]+/)
    .map((address) => address.trim())
    .filter(Boolean)
    .join(", ");
}

