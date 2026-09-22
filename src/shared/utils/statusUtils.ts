// src/shared/utils/statusUtils.ts

import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

/**
 * 指定されたステータスが「実行中」かどうかを判定する（一元管理）
 */
export function isRunningStatus(status?: JobStatus | null): boolean {
  if (!status) return false;
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

/**
 * 指定されたステータスが「完了（終端）」かどうかを判定する（一元管理）
 */
export function isTerminalStatus(status?: JobStatus | null): boolean {
  if (!status) return false;
  return status === JOB_STATUS.SUCCESS || status === JOB_STATUS.ERROR;
}
