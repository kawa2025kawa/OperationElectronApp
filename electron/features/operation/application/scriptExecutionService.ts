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
  type ScriptFilePath,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatMissingKanriNos,
} from "@electron/features/operation/domain/dependencyUtils";

export type { ManualScriptExecutionInput };
export { getScriptExecutionRequirement };

function extractZipPath(error: unknown): string | null {
  const msg = error instanceof Error ? error.message : String(error);
  const m = msg.match(
    /(?:^|\r?\n)[ \t]*(?:出力ZIP|ZIP出力先)?[ \t]*:?[ \t]*((?:[A-Z]:\\|\\\\)[^\r\n]*?\.zip)/im,
  );
  return m?.[1]?.trim() ?? null;
}

async function confirmAndRemoveZip(zipPath: string): Promise<boolean> {
  const res = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["削除して再実行", "キャンセル"],
    defaultId: 0,
    cancelId: 1,
    title: "ZIPファイル検出",
    message: "対象のZIPファイルを削除して再実行しますか？",
    detail: zipPath,
  });
  if (res !== 0) return false;

  try {
    await fs.unlink(zipPath);
    return true;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "ENOENT"
    )
      return true;
    throw err;
  }
}

function validateScriptExecutionInput(
  scriptKey: string,
  filePath?: ScriptFilePath,
): void {
  if (!getScriptExecutionRequirement(scriptKey).requiresFileSelection) return;
  const paths = (Array.isArray(filePath) ? filePath : [filePath]).filter(
    (p): p is string => Boolean(p?.trim()),
  );
  if (paths.length === 0) {
    throw new Error(
      `スクリプト ${scriptKey} の実行にはファイルの選択が必要です。`,
    );
  }
}

function validateJobDependencies(kanriNo: string): void {
  const result = checkJobDependencies(
    kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );
  if (result.ok) return;
  const missing = formatMissingKanriNos(result.missingDependencies);
  throw new Error(
    missing ? `未完了前作業 (No.${missing})` : "未完了前作業あり",
  );
}

function finalizeStatus(
  kanriNo: string,
  status: JobStatus,
  comment: string,
): void {
  if (status === JOB_STATUS.SCRIPT_RUNNING) {
    updateStatus({ kanriNo, status, comment });
    return;
  }

  updateStatus({ kanriNo, status, endTime: new Date().toISOString(), comment });
}

function applyScriptExecutionResult(kanriNo: string, result: JobResult): void {
  const status =
    result.success === false || result.kind === "error"
      ? JOB_STATUS.ERROR
      : result.kind === "running"
        ? JOB_STATUS.SCRIPT_RUNNING
        : result.kind === "needsAction"
          ? JOB_STATUS.NEEDS_ACTION
          : JOB_STATUS.SUCCESS;

  finalizeStatus(
    kanriNo,
    status,
    result.message ||
      (status === JOB_STATUS.ERROR
        ? "スクリプト実行失敗"
        : status === JOB_STATUS.SCRIPT_RUNNING
          ? "バックグラウンド監視中"
          : status === JOB_STATUS.NEEDS_ACTION
            ? "要対応"
            : "スクリプト実行完了"),
  );
}

export async function executeScriptAndApplyStatus(
  kanriNo: string,
  execute: () => Promise<JobResult>,
): Promise<JobResult> {
  try {
    let result = await execute();
    if (result.success === false || result.kind === "error") {
      const zip = extractZipPath(result.message);
      if (zip && (await confirmAndRemoveZip(zip))) {
        result = await execute();
      }
    }
    applyScriptExecutionResult(kanriNo, result);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    finalizeStatus(kanriNo, JOB_STATUS.ERROR, `実行エラー: ${msg}`);
    throw err;
  }
}

export async function executeManualScript(
  input: ManualScriptExecutionInput,
): Promise<JobResult> {
  const kanriNo = normalizeKanriNo(input.kanriNo);
  const scriptKey = input.scriptKey?.trim() || kanriNo;

  if (!input.ignoreDependencies) validateJobDependencies(kanriNo);
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
