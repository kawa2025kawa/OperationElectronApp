// src/shared/utils/getValueByPath.ts

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const getValueByPath = (
  obj: object | null | undefined,
  path: string | undefined,
): string => {
  if (!obj || !path) return "-";
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (isObject(current)) {
      current = current[key];
    } else {
      return "-";
    }
  }
  return current !== null && current !== undefined && current !== ""
    ? String(current)
    : "-";
};
