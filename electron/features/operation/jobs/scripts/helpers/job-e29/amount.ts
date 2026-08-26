//electron\features\operation\jobs\scripts\helpers\job-e29\amount.ts

export function parseAmount(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    return normalizeAmount(value);
  }

  if (typeof value === "boolean") {
    return normalizeAmount(String(value));
  }

  if (value instanceof Date) {
    return normalizeAmount(value.toString());
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    if ("result" in objectValue && objectValue.result != null) {
      return parseAmount(objectValue.result);
    }

    if ("richText" in objectValue && Array.isArray(objectValue.richText)) {
      const text = objectValue.richText
        .map((item) => {
          if (item && typeof item === "object" && "text" in item) {
            return String((item as { text?: unknown }).text ?? "");
          }

          return "";
        })
        .join("");

      return normalizeAmount(text);
    }

    return normalizeAmount(String(value));
  }

  return normalizeAmount(String(value));
}

function normalizeAmount(text: string): number | null {
  const normalized = text
    .replace(/,/g, "")
    .replace(/円/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!normalized) {
    return null;
  }

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

export function parseRealYosanAmount(value: unknown): number | null {
  const amountInThousands = parseAmount(value);

  if (amountInThousands === null) {
    return null;
  }

  return amountInThousands * 1000;
}

export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}
