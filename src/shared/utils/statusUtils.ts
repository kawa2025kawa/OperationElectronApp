// src/shared/utils/statusUtils.ts

import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

/**
 * 指定されたステータスが「完了」かどうかを判定する（一元管理）
 */
export function isSuccessStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.SUCCESS;
}
