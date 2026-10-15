// electron/features/operation/application/scriptExecutionStatus.ts

import { updateStatus } from "@electron/features/operation/application/statusManager";
import {
  JOB_STATUS,
  type JobResult,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

function finalizeScriptStatus(
  kanriNo: string,
  status: JobStatus,
  comment: string,
): void {
  updateStatus({
    kanriNo,
    status,
    endTime: new Date().toISOString(),
    comment,
  });
}

export function applyScriptExecutionResult(
  kanriNo: string,
  result: JobResult,
): void {
  finalizeScriptStatus(
    kanriNo,
    result.success === false ? JOB_STATUS.ERROR : JOB_STATUS.SUCCESS,
    result.message ||
      (result.success === false ? "スクリプト実行失敗" : "スクリプト実行完了"),
  );
}

export function applyScriptExecutionError(
  kanriNo: string,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);

  finalizeScriptStatus(kanriNo, JOB_STATUS.ERROR, `実行エラー: ${message}`);
}
