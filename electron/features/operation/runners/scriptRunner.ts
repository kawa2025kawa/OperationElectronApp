// electron/features/operation/runners/scriptRunner.ts

import * as jobs from "@electron/features/operation/jobs/scripts";
import {
  isAutoWorkType,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import { startRdpSession } from "@electron/features/rdp/rdpService";
import type {
  JobResult,
  OperationScriptKey,
  OperationWorkType,
  ScriptExecutionRequirement,
} from "@shared/types/operation/operationTypes";

export type ScriptFilePath = string | string[];

type ScriptExecutionType = "manual" | "auto";

interface OperationRdpKey {
  key: string;
  label?: string;
  executionTypes?: ScriptExecutionType[];
}

type JobResultKind =
  | "success"
  | "difference"
  | "needsAction"
  | "error"
  | "retrying"
  | "running";

type ScriptRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

interface RegisteredScript {
  readonly key: string;
  readonly label?: string;
  readonly run?: ScriptRunnerFn;
  readonly requiresFileSelection?: boolean;
}

const defineScript = (
  key: string,
  label: string,
  run?: ScriptRunnerFn,
  requiresFileSelection = false,
): RegisteredScript => ({
  key,
  label,
  ...(run ? { run } : {}),
  ...(requiresFileSelection ? { requiresFileSelection: true } : {}),
});

const DEFAULT_OPERATION_RDP_KEYS: Readonly<
  Record<string, readonly OperationRdpKey[]>
> = {
  E51: [{ key: "MD帳票サーバ", label: "MD帳票", executionTypes: ["manual"] }],
  N27: [
    { key: "WEBEDI_DB", label: "webedi_db", executionTypes: ["manual"] },
    { key: "WEBEDI", label: "webedi", executionTypes: ["manual"] },
  ],
  N28: [{ key: "WEBEDI", label: "webedi", executionTypes: ["manual"] }],
};

const OPERATION_SCRIPT_REGISTRY: Readonly<
  Record<string, readonly RegisteredScript[]>
> = {
  // Eシリーズ
  E1: [defineScript("E1", "Script", () => jobs.runJobE1())],
  E4: [defineScript("E4", "Script", () => jobs.runJobE4())],
  E5: [
    defineScript("E5", "Script1", (_, p) => jobs.runJobE5(p), true),
    defineScript("E55", "Script2", () => jobs.runJobE55()),
  ],
  E8: [defineScript("E8", "Script", () => jobs.runJobE8())],
  E88: [defineScript("E88", "Script", () => jobs.runJobE8())],
  E9: [defineScript("E9", "Script", () => jobs.runJobE9())],
  E14: [defineScript("E14", "Script", (_, p) => jobs.runJobE14(p), true)],
  E27: [defineScript("E27", "Script", (_, p) => jobs.runJobE27(p), true)],
  E29: [defineScript("E29", "Script", (_, p) => jobs.runJobE29(p), true)],
  E30: [defineScript("E30", "Script", (_, p) => jobs.runJobE30(p), true)],
  E41: [defineScript("E41", "Script", (_, p) => jobs.runJobE41(p), true)],

  // Nシリーズ
  N12: [defineScript("N12", "Script", jobs.runJobN12)],
  N250: [defineScript("N250", "N250", jobs.runJobN250)],
  N31: [defineScript("N31", "Script", jobs.runJobN31)],
  N33: [defineScript("N33", "Script", jobs.runJobN33)],

  // 数字系
  "114": [defineScript("114", "Script", jobs.runJob114)],
  "16": [defineScript("16", "Script", jobs.runJob16)],
  "20": [defineScript("20", "Script", jobs.runJob20)],
  "25": [defineScript("25", "Script", jobs.runJob25)],
  "28": [defineScript("28", "Script", jobs.runJob28)],
  "39": [defineScript("39", "Script", jobs.runJob39)],
  "43": [defineScript("28", "Script", jobs.runJob28)],
  "56": [defineScript("56", "Script", jobs.runJob56)],
  "60": [defineScript("60", "ロック状態", jobs.runJob6066)],
  "62": [defineScript("62", "Script", jobs.runJob62)],
  "64": [defineScript("64", "Script", jobs.runJob64)],
  "66": [defineScript("66", "ロック状態", jobs.runJob6066)],
  "68": [defineScript("28", "Script", jobs.runJob28)],
  "80": [defineScript("80", "Script", jobs.runJob80)],

  // PDF
  "30": [defineScript("30", "PDF")],
  "37": [defineScript("37", "PDF")],
  "45": [defineScript("45", "PDF")],
  "48": [defineScript("48", "PDF")],
  "54": [defineScript("54", "PDF")],
};

const NEEDS_ACTION_PATTERN =
  /▶\s*\[\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*要対応/;
const DIFFERENCE_PATTERN =
  /▶\s*\[\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*差分あり/;

const normalizeKey = (key: string): string => key.trim().toUpperCase();

function resolveExecutionTypes(
  workType?: OperationWorkType | string | null,
  hasRunner = true,
): ScriptExecutionType[] {
  return hasRunner && isAutoWorkType(workType)
    ? ["auto", "manual"]
    : ["manual"];
}

function findRegisteredScript(scriptKey: string): RegisteredScript | undefined {
  const normalizedKey = normalizeKey(scriptKey);
  for (const scripts of Object.values(OPERATION_SCRIPT_REGISTRY)) {
    const matched = scripts.find(
      (script) => normalizeKey(script.key) === normalizedKey,
    );
    if (matched) return matched;
  }
  return undefined;
}

export function getRdpKeysForOperation(
  kanriNo: string,
  rdpKeys?: readonly OperationRdpKey[] | null,
): readonly OperationRdpKey[] {
  return rdpKeys?.length
    ? rdpKeys
    : (DEFAULT_OPERATION_RDP_KEYS[normalizeKanriNo(kanriNo).toUpperCase()] ??
        []);
}

export function getScriptKeysForOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
  workType?: OperationWorkType | string | null,
): readonly OperationScriptKey[] {
  if (scriptKeys?.length) {
    return scriptKeys.map((script) => ({
      ...script,
      executionTypes: script.executionTypes?.length
        ? script.executionTypes
        : resolveExecutionTypes(
            workType,
            Boolean(findRegisteredScript(script.key)?.run),
          ),
    }));
  }

  const registered =
    OPERATION_SCRIPT_REGISTRY[normalizeKanriNo(kanriNo).toUpperCase()] ?? [];

  return registered.map(({ key, label, run, requiresFileSelection }) => ({
    key,
    label,
    executionTypes: resolveExecutionTypes(workType, Boolean(run)),
    ...(requiresFileSelection ? { requiresFileSelection: true } : {}),
  }));
}

export function isPdfUploadOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): boolean {
  return getScriptKeysForOperation(kanriNo, scriptKeys).some(
    (key) => key.label?.toUpperCase() === "PDF",
  );
}

export const getScriptExecutionRequirement = (
  scriptKey: string,
): ScriptExecutionRequirement => ({
  requiresFileSelection:
    findRegisteredScript(scriptKey)?.requiresFileSelection ?? false,
});

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
    return {
      success: true,
      kind: detectKindFromMessage(trimmedMessage),
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
    const runner =
      findRegisteredScript(cleanKey)?.run ??
      findRegisteredScript(cleanKanriNo)?.run;
    const output = runner
      ? await runner(cleanKanriNo, filePath)
      : await startRdpSession(cleanKey);
    return normalizeScriptResult(output);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, kind: "error", message: `エラー: ${msg.trim()}` };
  }
}
