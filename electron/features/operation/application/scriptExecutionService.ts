// electron/features/operation/application/scriptExecutionService.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  getDependencyMasters,
  getDependencyStatuses,
  updateStatus,
} from "@electron/features/operation/application/statusManager";
import { validateScriptExecutionInput } from "@electron/features/operation/application/scriptExecutionRequirements";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { runScriptWithZipRecovery } from "@electron/features/operation/infrastructure/recovery/zipRecoveryHelper";
import {
  JOB_STATUS,
  type JobResult,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatMissingKanriNos,
} from "@shared/utils/dependency/dependencyUtils";

export interface ManualScriptExecutionInput {
  kanriNo: string;
  scriptKey?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
}

// 前提作業の完了状況を検証する。
// 未完了前作業がある場合はステータスを変更（ERROR更新）せず、例外のみを送出する。
function validateJobDependencies(kanriNo: string): void {
  const dependencyResult = checkJobDependencies(
    kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  if (dependencyResult.ok) {
    return;
  }

  const missingNos = formatMissingKanriNos(
    dependencyResult.missingDependencies,
  );

  const message =
    missingNos.length > 0
      ? `未完了前作業 (No.${missingNos})`
      : "未完了前作業あり";

  throw new Error(message);
}

// 終了時刻と指定されたステータス・コメントを反映してスクリプトステータスを確定する。
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

// スクリプト実行結果オブジェクトに基づいて成功またはエラーステータスを記録する。
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

// スクリプト実行中に発生した例外エラーをエラーステータスとして確定記録する。
export function applyScriptExecutionError(
  kanriNo: string,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);

  finalizeScriptStatus(kanriNo, JOB_STATUS.ERROR, `実行エラー: ${message}`);
}

// 前提依存関係および引数を検証し、手動スクリプトを実行して結果を反映する。
export async function executeManualScript(
  input: ManualScriptExecutionInput,
): Promise<JobResult> {
  const kanriNo = normalizeKanriNo(input.kanriNo);
  const scriptKey = input.scriptKey?.trim() || kanriNo;

  // 1. 依存関係のチェック（未達なら例外を送出し、ステータス変更を行わない）
  if (!input.ignoreDependencies) {
    validateJobDependencies(kanriNo);
  }

  // 2. 引数バリデーション
  validateScriptExecutionInput(scriptKey, input.filePath);

  // 3. 実行開始ステータス（SCRIPT_RUNNING）を即時通知
  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
  });

  // 4. スクリプト実行と結果の確定
  try {
    const result = await runScriptWithZipRecovery(
      kanriNo,
      scriptKey,
      input.filePath,
    );

    applyScriptExecutionResult(kanriNo, result);
    return result;
  } catch (error: unknown) {
    applyScriptExecutionError(kanriNo, error);
    throw error;
  }
}
