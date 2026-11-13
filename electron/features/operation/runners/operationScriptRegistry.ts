// electron/features/operation/runners/operationScriptRegistry.ts

import * as jobs from "@electron/features/operation/jobs/scripts";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type {
  JobResult,
  OperationScriptKey,
  ScriptExecutionRequirement,
  ScriptExecutionType,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptExecutionRequirement };

type ScriptRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

interface RegisteredScript extends OperationScriptKey {
  run?: ScriptRunnerFn;
}

const defineScript = (
  key: string,
  label: string,
  executionTypes: ScriptExecutionType[],
  run?: ScriptRunnerFn,
  requiresFileSelection = false,
): RegisteredScript => ({
  key,
  label,
  executionTypes,
  ...(run ? { run } : {}),
  ...(requiresFileSelection ? { requiresFileSelection: true } : {}),
});

/**
 * スクリプト登録定義
 *
 * 管理Noごとに表示・実行するスクリプトを定義する。
 * 実行関数・表示ラベル・実行方式・ファイル選択要否をここに集約する。
 */
const OPERATION_SCRIPT_REGISTRY: Readonly<
  Record<string, readonly RegisteredScript[]>
> = {
  // Eシリーズ
  E1: [defineScript("E1", "Script", ["manual"], () => jobs.runJobE1())],
  E4: [defineScript("E4", "Script", ["manual"], () => jobs.runJobE4())],
  E5: [
    defineScript("E5", "Script1", ["manual"], (_, p) => jobs.runJobE5(p), true),
    defineScript("E55", "Script2", ["manual"], () => jobs.runJobE55()),
  ],
  E8: [
    defineScript("E8", "Script", ["manual"], () => jobs.runJobE8()),
    defineScript("E88", "Script", ["manual"], () => jobs.runJobE8()),
  ],
  E9: [defineScript("E9", "Script", ["manual"], () => jobs.runJobE9())],
  E14: [
    defineScript(
      "E14",
      "Script",
      ["manual"],
      (_, p) => jobs.runJobE14(p),
      true,
    ),
  ],
  E29: [
    defineScript(
      "E29",
      "Script",
      ["manual"],
      (_, p) => jobs.runJobE29(p),
      true,
    ),
  ],
  E30: [
    defineScript(
      "E30",
      "Script",
      ["manual"],
      (_, p) => jobs.runJobE30(p),
      true,
    ),
  ],
  E41: [
    defineScript(
      "E41",
      "Script",
      ["manual"],
      (_, p) => jobs.runJobE41(p),
      true,
    ),
  ],

  // Nシリーズ
  N12: [defineScript("N12", "Script", ["manual"], jobs.runJobN12)],
  N25: [defineScript("N25", "N25", ["auto", "manual"], jobs.runJobN25)],
  N31: [defineScript("N31", "Script", ["auto", "manual"], jobs.runJobN31)],
  N33: [defineScript("N33", "Script", ["auto", "manual"], jobs.runJobN33)],

  // 数字系
  "114": [defineScript("114", "Script", ["auto", "manual"], jobs.runJob114)],
  "16": [defineScript("16", "Script", ["auto", "manual"], jobs.runJob16)],
  "20": [defineScript("20", "Script", ["auto", "manual"], jobs.runJob20)],
  "25": [defineScript("25", "Script", ["auto", "manual"], jobs.runJob25)],
  "28": [defineScript("28", "Script", ["auto", "manual"], jobs.runJob28)],
  "34": [defineScript("34", "Script", ["auto", "manual"], jobs.runJob34)],
  "39": [defineScript("39", "Script", ["auto", "manual"], jobs.runJob39)],
  "43": [defineScript("28", "Script", ["auto", "manual"], jobs.runJob28)],
  "56": [defineScript("56", "Script", ["auto", "manual"], jobs.runJob56)],
  "60": [defineScript("60", "ロック状態", ["manual"], jobs.runJob6066)],
  "62": [defineScript("62", "Script", ["manual"], jobs.runJob62)],
  "64": [defineScript("64", "Script", ["manual"], jobs.runJob64)],
  "66": [defineScript("66", "ロック状態", ["manual"], jobs.runJob6066)],
  "68": [defineScript("28", "Script", ["auto", "manual"], jobs.runJob28)],
  "80": [defineScript("80", "Script", ["auto", "manual"], jobs.runJob80)],

  // PDF
  "30": [defineScript("30", "PDF", ["manual"])],
  "37": [defineScript("37", "PDF", ["manual"])],
  "45": [defineScript("45", "PDF", ["manual"])],
  "48": [defineScript("48", "PDF", ["manual"])],
  "54": [defineScript("54", "PDF", ["manual"])],
};

const normalizeKey = (key: string): string => key.trim().toUpperCase();

/**
 * 登録済みスクリプトをキーから検索する。
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
 * 管理Noに対応するスクリプト一覧を取得する。
 *
 * マスター側にScriptKeysが指定されている場合はそちらを優先する。
 */
export function getScriptKeysForOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): readonly OperationScriptKey[] {
  if (scriptKeys?.length) return scriptKeys;

  const registered =
    OPERATION_SCRIPT_REGISTRY[normalizeKanriNo(kanriNo).toUpperCase()] ?? [];

  return registered.map(({ key, label, executionTypes }) => ({
    key,
    label,
    executionTypes,
  }));
}

/**
 * PDFアップロード対象か判定する。
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
 * スクリプト実行関数を取得する。
 */
export const getScriptRunner = (
  scriptKey: string,
): ScriptRunnerFn | undefined => findRegisteredScript(scriptKey)?.run;

/**
 * スクリプトの実行要件を取得する。
 */
export const getScriptExecutionRequirement = (
  scriptKey: string,
): ScriptExecutionRequirement => ({
  requiresFileSelection:
    findRegisteredScript(scriptKey)?.requiresFileSelection ?? false,
});
