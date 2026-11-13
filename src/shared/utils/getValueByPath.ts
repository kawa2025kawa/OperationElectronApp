// src/shared/utils/getValueByPath.ts

import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";

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
  if (!obj || !path) return EMPTY_VALUE_FALLBACK;

  const keys = getPathKeys(path);
  let current: unknown = obj;

  for (const key of keys) {
    if (isObject(current)) {
      current = current[key];
    } else {
      return EMPTY_VALUE_FALLBACK;
    }
  }

  return current !== null && current !== undefined && current !== ""
    ? String(current)
    : EMPTY_VALUE_FALLBACK;
};
