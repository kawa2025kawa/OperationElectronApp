// src/shared/utils/sharedUtils.ts

import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

const EMPTY_DASH_PATTERN = /^[-‐‑–—―−ー]$/;

/** 空白やハイフン類（"-" / "ー" 等）を空文字列 "" に正規化する */
export function cleanDashCell(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return !trimmed || EMPTY_DASH_PATTERN.test(trimmed) ? "" : trimmed;
}

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

export function isRunningStatus(
  status?: JobStatus | null,
): status is typeof JOB_STATUS.RUNNING | typeof JOB_STATUS.SCRIPT_RUNNING {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

/** unknown なエラー値からメッセージ文字列を取り出す */
export function toErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const text = String(error ?? "");
  return text || fallback || "予期しないエラーが発生しました";
}
