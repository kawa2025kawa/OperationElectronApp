// src/shared/utils/sharedUtils.ts

import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO } from "date-fns";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

export const EMPTY_VALUE_FALLBACK = "-" as const;

const JST_TIME_ZONE = "Asia/Tokyo" as const;
const JAPAN_DATE_TIME_FORMAT = "yyyy/MM/dd HH:mm:ss" as const;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const PROTECTED_STATUSES: ReadonlySet<JobStatus> = new Set([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
]);

const PATH_KEYS_CACHE = new Map<string, string[]>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Date オブジェクトを日本時間（YYYY/MM/DD HH:mm:ss）に整形する */
export function formatJapanDateTime(date: Date): string {
  return isValid(date)
    ? format(new TZDate(date, JST_TIME_ZONE), JAPAN_DATE_TIME_FORMAT)
    : String(date);
}

/** ISO 8601 形式の日時文字列であれば日本時間（YYYY/MM/DD HH:mm:ss）に整形して返す */
export function tryFormatIsoDateTime(value: string): string {
  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  const date = parseISO(value);
  return isValid(date)
    ? format(new TZDate(date, JST_TIME_ZONE), JAPAN_DATE_TIME_FORMAT)
    : value;
}

/** ファイルパスまたはURLからファイル名を取得する */
export const getFileName = (filePath: string): string => {
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

/** 管理番号を前後の空白除去・全角英数字の半角化・大文字化で正規化する */
export function normalizeKanriNo(
  kanriNo: string | number | null | undefined,
): string {
  if (kanriNo == null) return "";
  return String(kanriNo)
    .trim()
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toUpperCase();
}

export function isSuccessStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.SUCCESS;
}

export function isRunningStatus(
  status?: JobStatus | null,
): status is typeof JOB_STATUS.RUNNING | typeof JOB_STATUS.SCRIPT_RUNNING {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

export function isProtectedStatus(
  status?: JobStatus | null,
): status is JobStatus {
  return status != null && PROTECTED_STATUSES.has(status);
}
