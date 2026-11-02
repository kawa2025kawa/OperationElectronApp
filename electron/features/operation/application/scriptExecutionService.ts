// electron/features/operation/application/scriptExecutionService.ts

import fs from "node:fs/promises";
import { dialog } from "electron";
import {
  getActiveFlags,
  getDependencyMasters,
  getDependencyStatuses,
  updateStatus,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { getScriptExecutionRequirement } from "@electron/features/operation/runners/operationScriptRegistry";
import { executeSingleScriptJob } from "@electron/features/operation/runners/scriptRunner";
import {
  JOB_STATUS,
  type JobResult,
  type JobStatus,
  type ManualScriptExecutionInput,
  type ScriptExecutionRequirement,
  type ScriptFilePath,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatMissingKanriNos,
} from "@electron/features/operation/domain/dependencyUtils";

export type {
  ManualScriptExecutionInput,
  ScriptExecutionRequirement,
  ScriptFilePath,
};
export { getScriptExecutionRequirement };

// エラーメッセージからZIPパスを抽出
function extractZipPath(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const patterns = [
    /(?:^|\r?\n)[ \t]*(?:出力ZIP|ZIP出力先)[ \t]*:[ \t]*((?:[A-Z]:\\|\\\\)[^\r\n]*?\.zip)[ \t]*(?=\r?$|\r?\n)/im,
    /(?:^|\r?\n)[ \t]*((?:[A-Z]:\\|\\\\)[^\r\n]*?\.zip)[ \t]*(?=\r?$|\r?\n)/im,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

// 既存ZIPの削除と再実行確認
async function confirmAndRemoveZip(zipPath: string): Promise<boolean> {
  const response = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["削除して再実行", "キャンセル"],
    defaultId: 0,
    cancelId: 1,
    title: "ZIPファイル検出",
    message: "対象のZIPファイルを削除して再実行しますか？",
    detail: zipPath,
  });

  if (response !== 0) return false;

  try {
    await fs.unlink(zipPath);
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return true;
    }
    throw error;
  }
}

// ファイル選択必須スクリプトの入力検証
export function validateScriptExecutionInput(
  scriptKey: string,
  filePath?: ScriptFilePath,
): void {
  const requirement = getScriptExecutionRequirement(scriptKey);
  if (!requirement.requiresFileSelection) return;

  const rawPaths = Array.isArray(filePath)
    ? filePath
    : typeof filePath === "string"
      ? [filePath]
      : [];

  const validPaths = rawPaths.map((p) => p.trim()).filter(Boolean);
  if (validPaths.length === 0) {
    throw new Error(
      `スクリプト ${scriptKey} の実行にはファイルの選択が必要です。`,
    );
  }
}

// 前提依存関係の検証
function validateJobDependencies(kanriNo: string): void {
  const dependencyResult = checkJobDependencies(
    kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  if (dependencyResult.ok) return;

  const missingNos = formatMissingKanriNos(
    dependencyResult.missingDependencies,
  );
  throw new Error(
    missingNos.length > 0
      ? `未完了前作業 (No.${missingNos})`
      : "未完了前作業あり",
  );
}

// ステータスと終了時刻を確定記録
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

// 実行結果に応じたステータス確定
export function applyScriptExecutionResult(
  kanriNo: string,
  result: JobResult,
): void {
  const status: JobStatus =
    result.success === false || result.kind === "error"
      ? JOB_STATUS.ERROR
      : result.kind === "needsAction"
        ? JOB_STATUS.NEEDS_ACTION
        : JOB_STATUS.SUCCESS;

  finalizeScriptStatus(
    kanriNo,
    status,
    result.message ||
      (status === JOB_STATUS.ERROR
        ? "スクリプト実行失敗"
        : status === JOB_STATUS.NEEDS_ACTION
          ? "要対応"
          : "スクリプト実行完了"),
  );
}

// 実行パイプライン（ZIP競合リカバリ・結果記録・例外ハンドリングを一括管理）
export async function executeScriptAndApplyStatus(
  kanriNo: string,
  execute: () => Promise<JobResult>,
): Promise<JobResult> {
  try {
    let result = await execute();

    // ZIP競合によるエラーの場合はリカバリ確認
    if (result.success === false || result.kind === "error") {
      const zipPath = extractZipPath(result.message);
      if (zipPath && (await confirmAndRemoveZip(zipPath))) {
        result = await execute();
      }
    }

    applyScriptExecutionResult(kanriNo, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finalizeScriptStatus(kanriNo, JOB_STATUS.ERROR, `実行エラー: ${message}`);
    throw error;
  }
}

// 手動スクリプト実行エントリーポイント
export async function executeManualScript(
  input: ManualScriptExecutionInput,
): Promise<JobResult> {
  const kanriNo = normalizeKanriNo(input.kanriNo);
  const scriptKey = input.scriptKey?.trim() || kanriNo;

  if (!input.ignoreDependencies) {
    validateJobDependencies(kanriNo);
  }

  validateScriptExecutionInput(scriptKey, input.filePath);

  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
  });

  return executeScriptAndApplyStatus(kanriNo, () =>
    executeSingleScriptJob(kanriNo, scriptKey, input.filePath),
  );
}
