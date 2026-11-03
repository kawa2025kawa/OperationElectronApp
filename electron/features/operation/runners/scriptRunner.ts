// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { startRdpSession } from "@electron/features/rdp/rdpService";
import { getScriptRunner } from "@electron/features/operation/runners/operationScriptRegistry";
import type {
  JobResult,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptFilePath } from "@shared/types/operation/operationTypes";

function normalizeScriptResult(result: string | JobResult): JobResult {
  if (typeof result === "string") {
    return {
      success: true,
      kind: "success",
      message: result.trim() || "正常終了",
    };
  }
  const success = result.success !== false;
  return {
    ...result,
    success,
    kind: result.kind ?? (success ? "success" : "error"),
    message: result.message?.trim() || (success ? "正常終了" : "エラー"),
  };
}

export async function executeSingleScriptJob(
  kanriNo: string,
  targetKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const cleanKanriNo = normalizeKanriNo(kanriNo);
  const cleanKey = targetKey.trim();

  if (!cleanKey) {
    return {
      success: false,
      kind: "error",
      message: `スクリプトキーが指定されていません (No.${cleanKanriNo})`,
    };
  }

  try {
    const runner = getScriptRunner(cleanKey) ?? getScriptRunner(cleanKanriNo);
    const output = runner
      ? await runner(cleanKanriNo, filePath)
      : await startRdpSession(cleanKey);
    return normalizeScriptResult(output);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, kind: "error", message: `エラー: ${msg.trim()}` };
  }
}
