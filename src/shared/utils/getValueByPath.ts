// src/shared/utils/getValueByPath.ts

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * ネストされたオブジェクトから文字列のパス（例: "today.amStatus"）を指定して値を取得するユーティリティ。
 * 値が存在しない、または空文字の場合は "-" を返却します。
 */
export const getValueByPath = (obj: Record<string, unknown>, path: string | undefined): string => {
  if (!path) return "-";
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (isObject(current)) {
      current = current[key];
    } else {
      return "-";
    }
  }

  return current !== null && current !== undefined && current !== "" ? String(current) : "-";
};
