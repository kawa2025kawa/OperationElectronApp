// src\renderer\features\other\utils\gmailModalUtils.ts

export function getNextTuesdayString(): string {
  const now = new Date();

  const daysUntilNextTuesday = (2 - now.getDay() + 7) % 7 || 7;

  const nextTuesday = new Date(now);

  nextTuesday.setDate(now.getDate() + daysUntilNextTuesday);

  return `${nextTuesday.getMonth() + 1}月${nextTuesday.getDate()}日`;
}

export function stripHtmlTags(html: string): string {
  if (!html) {
    return "";
  }

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

export function formatEmailAddresses(input: string): string {
  return input
    .split(/[\n,]+/)
    .map((address) => address.trim())
    .filter(Boolean)
    .join(", ");
}
