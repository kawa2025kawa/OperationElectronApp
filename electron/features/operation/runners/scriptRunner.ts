// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { startRdpSession } from "@electron/features/rdp/rdpService";
import { getScriptRunner } from "@electron/features/operation/runners/operationScriptRegistry";
import type {
  JobResult,
  JobResultKind,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptFilePath } from "@shared/types/operation/operationTypes";

const NEEDS_ACTION_PATTERN =
  /▶\s*\[\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*要対応/;
const DIFFERENCE_PATTERN =
  /▶\s*\[\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*差分あり/;

function detectKindFromMessage(message: string): JobResultKind {
  if (NEEDS_ACTION_PATTERN.test(message) || message.includes("要対応")) {
    return "needsAction";
  }
  if (DIFFERENCE_PATTERN.test(message) || message.includes("差分あり")) {
    return "difference";
  }
  return "success";
}

function normalizeScriptResult(result: string | JobResult): JobResult {
  if (typeof result === "string") {
    const trimmedMessage = result.trim() || "正常終了";
    const kind = detectKindFromMessage(trimmedMessage);

    return {
      success: true,
      kind,
      message: trimmedMessage,
    };
  }

  const success = result.success !== false;
  const rawMessage =
    result.message?.trim() || (success ? "正常終了" : "エラー");
  const kind =
    result.kind ?? (!success ? "error" : detectKindFromMessage(rawMessage));

  return {
    ...result,
    success,
    kind,
    message: rawMessage,
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
