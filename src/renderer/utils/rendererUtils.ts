// src/renderer/utils/rendererUtils.ts

import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO } from "date-fns";
import { toErrorMessage } from "@shared/utils/sharedUtils";

export { toErrorMessage };

export const EMPTY_VALUE_FALLBACK = "-" as const;
export const JST_TIME_ZONE = "Asia/Tokyo" as const;

const JAPAN_DATE_TIME_FORMAT = "yyyy/MM/dd HH:mm:ss" as const;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const PATH_KEYS_CACHE = new Map<string, string[]>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export interface ResolvedFileItem {
  name: string;
  path: string;
}

/** Date オブジェクトを JST の TZDate に変換する */
export function toJstDate(date: Date): TZDate {
  return new TZDate(date, JST_TIME_ZONE);
}

/** Date オブジェクトを日本時間（YYYY/MM/DD HH:mm:ss）に整形する */
export function formatJapanDateTime(date: Date): string {
  return isValid(date)
    ? format(toJstDate(date), JAPAN_DATE_TIME_FORMAT)
    : String(date);
}

/** ISO 8601 形式の日時文字列であれば日本時間（YYYY/MM/DD HH:mm:ss）に整形して返す */
export function tryFormatIsoDateTime(value: string): string {
  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  const date = parseISO(value);
  return isValid(date)
    ? format(toJstDate(date), JAPAN_DATE_TIME_FORMAT)
    : value;
}

/** ファイルパスまたはURLからファイル名を取得する */
const getFileName = (filePath: string): string => {
  if (!filePath) return "";
  return filePath.split(/[/\\]/).pop() ?? filePath;
};

function getPathKeys(path: string): string[] {
  let keys = PATH_KEYS_CACHE.get(path);
  if (!keys) {
    keys = path.split(".");
    PATH_KEYS_CACHE.set(path, keys);
  }
  return keys;
}

export const getRawValueByPath = (
  obj: unknown,
  path: string | undefined,
): unknown => {
  if (!isObject(obj) || !path) return undefined;

  const keys = getPathKeys(path);
  let current: unknown = obj;

  for (const key of keys) {
    if (isObject(current)) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
};

export const getValueByPath = (
  obj: object | null | undefined,
  path: string | undefined,
): string => {
  const current = getRawValueByPath(obj, path);

  return current !== null && current !== undefined && current !== ""
    ? String(current)
    : EMPTY_VALUE_FALLBACK;
};

function resolveDroppedFilePath(file: File): string {
  const fromBridge = window.electronAPI.getFilePath(file);
  if (fromBridge) {
    return fromBridge;
  }

  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }

  return "";
}

/** File オブジェクトを { name, path } 形式へ変換する（パス未取得時は null） */
export function toResolvedFileItem(
  file: File,
  fallbackToName = false,
): ResolvedFileItem | null {
  const path =
    resolveDroppedFilePath(file) || (fallbackToName ? file.name : "");
  if (!path) {
    return null;
  }

  return {
    name: file.name || getFileName(path) || path,
    path,
  };
}
