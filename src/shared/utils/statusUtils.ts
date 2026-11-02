// src/shared/utils/statusUtils.ts

import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

const PROTECTED_STATUSES: ReadonlySet<JobStatus> = new Set([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
]);

/**
 * 管理番号を前後の空白を除去した文字列に正規化する。
 */
export function normalizeKanriNo(
  kanriNo: string | number | null | undefined,
): string {
  if (kanriNo == null) return "";
  return String(kanriNo).trim();
}

/**
 * 指定されたステータスが「完了」かどうかを判定する。
 */
export function isSuccessStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.SUCCESS;
}

/**
 * 指定されたステータスが「実行中（外部ジョブまたはアプリ内スクリプト）」かどうかを判定する。
 */
export function isRunningStatus(
  status?: JobStatus | null,
): status is typeof JOB_STATUS.RUNNING | typeof JOB_STATUS.SCRIPT_RUNNING {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

/**
 * 指定されたステータスが「実行可能（READY）」かどうかを判定する。
 */
export function isReadyStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.READY;
}

/**
 * 指定されたステータスが「待機（WAITING）」かどうかを判定する。
 */
export function isWaitingStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.WAITING;
}

/**
 * 指定されたステータスが「エラー（ERROR）」かどうかを判定する。
 */
export function isErrorStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.ERROR;
}

/**
 * ステータスが自動計算で上書きされない保護状態（実行中・完了・要対応・エラー等）か判定する。
 */
export function isProtectedStatus(
  status?: JobStatus | null,
): status is JobStatus {
  return status != null && PROTECTED_STATUSES.has(status);
}
