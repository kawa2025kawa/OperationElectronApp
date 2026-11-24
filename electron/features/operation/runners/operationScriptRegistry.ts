// electron/features/operation/runners/operationScriptRegistry.ts

import * as jobs from "@electron/features/operation/jobs/scripts";
import {
  isAutoWorkType,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import type {
  JobResult,
  OperationScriptKey,
  OperationWorkType,
  ScriptExecutionRequirement,
  ScriptExecutionType,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptExecutionRequirement };

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

/**
- スクリプト登録定義
 *
- 管理Noごとに表示・実行するスクリプトを定義する。
- 実行区分（自動/手動）はマスターの workType と実行関数（run）の有無を参照して動的に決定する。
 */
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
  "34": [defineScript("34", "Script", jobs.runJob34)],
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

const normalizeKey = (key: string): string => key.trim().toUpperCase();

function resolveExecutionTypes(
  workType?: OperationWorkType | string | null,
  hasRunner = true,
): ScriptExecutionType[] {
  return hasRunner && isAutoWorkType(workType) ? ["auto", "manual"] : ["manual"];
}

/**
- 登録済みスクリプトをキーから検索する。
 */
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

/**
- 管理Noに対応するスクリプト一覧を取得する。
 *
- マスター側にScriptKeysが指定されている場合はそちらを優先し、
- 実行区分（executionTypes）は workType と run 関数の有無に基づいて解決する。
 */
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

/**
- PDFアップロード対象か判定する。
 */
export function isPdfUploadOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): boolean {
  return getScriptKeysForOperation(kanriNo, scriptKeys).some(
    (key) => key.label?.toUpperCase() === "PDF",
  );
}

/**
- スクリプト実行関数を取得する。
 */
export const getScriptRunner = (
  scriptKey: string,
): ScriptRunnerFn | undefined => findRegisteredScript(scriptKey)?.run;

/**
- スクリプトの実行要件を取得する。
 */
export const getScriptExecutionRequirement = (
  scriptKey: string,
): ScriptExecutionRequirement => ({
  requiresFileSelection:
    findRegisteredScript(scriptKey)?.requiresFileSelection ?? false,
});
