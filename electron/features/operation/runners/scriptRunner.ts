// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { startRdpSession } from "@electron/features/rdp/rdpService";
import { getScriptRunner } from "@electron/features/operation/runners/operationScriptRegistry";
import type {
  JobResult,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptFilePath } from "@shared/types/operation/operationTypes";

// スクリプト実行結果または例外を標準の JobResult オブジェクトに正規化する。
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

// 単一スクリプトまたはRDPセッションを実行し、統一された JobResult を返す。
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

    if (runner) {
      const output = await runner(cleanKanriNo, filePath);
      return normalizeScriptResult(output);
    }

    const rdpOutput = await startRdpSession(cleanKey);
    return normalizeScriptResult(rdpOutput);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      kind: "error",
      message: `エラー: ${message.trim()}`,
    };
  }
}
