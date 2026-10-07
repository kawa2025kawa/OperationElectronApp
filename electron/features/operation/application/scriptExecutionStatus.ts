//electron\features\operation\application\scriptExecutionStatus.ts

import { updateStatus } from "@electron/features/operation/application/statusManager";
import {
  JOB_STATUS,
  type JobResult,
} from "@shared/types/operation/operationTypes";

export function applyScriptExecutionResult(
  kanriNo: string,
  result: JobResult,
): void {
  updateStatus({
    kanriNo,
    status: result.success === false ? JOB_STATUS.ERROR : JOB_STATUS.SUCCESS,
    endTime: new Date().toISOString(),
    comment:
      result.message ||
      (result.success === false ? "スクリプト実行失敗" : "スクリプト実行完了"),
  });
}

export function applyScriptExecutionError(
  kanriNo: string,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);

  updateStatus({
    kanriNo,
    status: JOB_STATUS.ERROR,
    endTime: new Date().toISOString(),
    comment: `実行エラー: ${message}`,
  });
}
