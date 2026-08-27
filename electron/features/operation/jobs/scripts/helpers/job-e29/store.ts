const STORE_CODE_REGEX = /^(\d{3})\s*[:：]/;
const TOTAL_ROW_REGEX = /^合[\s\u3000]*計$/;
const EXISTING_STORE_REGEX = /既存/;

function parseCellString(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toString().trim();
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    if ("result" in objectValue && objectValue.result != null) {
      return parseCellString(objectValue.result);
    }

    if ("richText" in objectValue && Array.isArray(objectValue.richText)) {
      return objectValue.richText
        .map((item) => {
          if (item && typeof item === "object" && "text" in item) {
            return String((item as { text?: unknown }).text ?? "");
          }

          return "";
        })
        .join("")
        .trim();
    }

    return String(value).trim();
  }

  return String(value).trim();
}

export function extractStoreCode(value: unknown): string | null {
  const text = parseCellString(value);

  if (!text || EXISTING_STORE_REGEX.test(text)) {
    return null;
  }

  const match = text.match(STORE_CODE_REGEX);

  return match?.[1] ?? null;
}

export function isTotalRow(value: unknown): boolean {
  const text = parseCellString(value);

  if (!text || EXISTING_STORE_REGEX.test(text)) {
    return false;
  }

  return TOTAL_ROW_REGEX.test(text);
}

function sortStoreCodes(
  entries: Iterable<[string, number]>,
): [string, number][] {
  return [...entries].sort(([codeA], [codeB]) => {
    const numberA = Number(codeA);
    const numberB = Number(codeB);

    if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
      return numberA - numberB;
    }

    return codeA.localeCompare(codeB, "ja");
  });
}
