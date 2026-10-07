// electron/features/operation/jobs/scripts/helpers/shared/parseAmount.ts
export function parseAmount(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let str: string;

  if (typeof value === "object") {
    const obj = value as {
      result?: unknown;
      richText?: Array<{ text?: unknown }>;
    };

    if (obj.result != null) {
      return parseAmount(obj.result);
    }

    if (Array.isArray(obj.richText)) {
      str = obj.richText.map((item) => String(item?.text ?? "")).join("");
    } else {
      str = String(value);
    }
  } else {
    str = String(value);
  }

  const normalized = str.replace(/[\s,]/g, "").trim();

  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const num = Number(normalized);

  return Number.isFinite(num) ? num : null;
}

export function parseRealYosanAmount(value: unknown): number | null {
  const amount = parseAmount(value);
  return amount !== null ? amount * 1000 : null;
}
