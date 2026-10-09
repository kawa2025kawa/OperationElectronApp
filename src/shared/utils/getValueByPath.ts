// src/shared/utils/getValueByPath.ts

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const PATH_KEYS_CACHE = new Map<string, string[]>();

function getPathKeys(path: string): string[] {
  let keys = PATH_KEYS_CACHE.get(path);

  if (!keys) {
    keys = path.split(".");
    PATH_KEYS_CACHE.set(path, keys);
  }

  return keys;
}

export const getValueByPath = (
  obj: object | null | undefined,
  path: string | undefined,
): string => {
  if (!obj || !path) return "-";

  const keys = getPathKeys(path);
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

