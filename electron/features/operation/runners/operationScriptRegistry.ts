// electron/features/operation/runners/operationScriptRegistry.ts

import * as jobs from "@electron/features/operation/jobs/scripts";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type {
  JobResult,
  OperationScriptKey,
  ScriptExecutionRequirement,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptExecutionRequirement, ScriptFilePath };

type ScriptRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

interface ScriptDefinitionConfig {
  run: ScriptRunnerFn;
  requiresFileSelection?: boolean;
}

/**
 * スクリプト実行定義の一元管理テーブル
 * 新規スクリプトの追加・削除・変更はここ1箇所に定義する
 */
const SCRIPT_DEFINITIONS: Readonly<Record<string, ScriptDefinitionConfig>> = {
  // Eシリーズ
  E1: { run: () => jobs.runJobE1() },
  E5: {
    run: (_, filePath) => jobs.runJobE5(filePath),
    requiresFileSelection: true,
  },
  E55: { run: () => jobs.runJobE55() },
  E8: { run: () => jobs.runJobE8() },
  E9: { run: () => jobs.runJobE9() },
  E14: {
    run: (_, filePath) => jobs.runJobE14(filePath),
    requiresFileSelection: true,
  },
  E29: {
    run: (_, filePath) => jobs.runJobE29(filePath),
    requiresFileSelection: true,
  },
  E30: {
    run: (_, filePath) => jobs.runJobE30(filePath),
    requiresFileSelection: true,
  },
  E41: {
    run: (_, filePath) => jobs.runJobE41(filePath),
    requiresFileSelection: true,
  },

  // Nシリーズ
  N12: { run: jobs.runJobN12 },
  N25: { run: jobs.runJobN25 },
  N31: { run: jobs.runJobN31 },
  N33: { run: jobs.runJobN33 },

  // 数字系
  "114": { run: jobs.runJob114 },
  "16": { run: jobs.runJob16 },
  "20": { run: jobs.runJob20 },
  "25": { run: jobs.runJob25 },
  "28": { run: jobs.runJob28 },
  "34": { run: jobs.runJob34 },
  "39": { run: jobs.runJob39 },
  "56": { run: jobs.runJob56 },
  "60": { run: jobs.runJob6066 },
  "62": { run: jobs.runJob62 },
  "64": { run: jobs.runJob64 },
  "66": { run: jobs.runJob6066 },
  "80": { run: jobs.runJob80 },
};

/**
 * 管理Noと実行キーのデフォルト対応表
 * PDF対象、手動、自動をすべてここで一元管理する
 */
const DEFAULT_OPERATION_KEYS: Readonly<
  Record<string, readonly OperationScriptKey[]>
> = {
  // 常時運用 (自動+手動スクリプト)
  "114": [{ key: "114", label: "Script", executionTypes: ["auto", "manual"] }],
  "16": [{ key: "16", label: "Script", executionTypes: ["auto", "manual"] }],
  "20": [{ key: "20", label: "Script", executionTypes: ["auto", "manual"] }],
  "25": [{ key: "25", label: "Script", executionTypes: ["auto", "manual"] }],
  "28": [{ key: "28", label: "Script", executionTypes: ["auto", "manual"] }],
  "34": [{ key: "34", label: "Script", executionTypes: ["auto", "manual"] }],
  "39": [{ key: "39", label: "Script", executionTypes: ["auto", "manual"] }],
  "43": [{ key: "28", label: "Script", executionTypes: ["auto", "manual"] }],
  "56": [{ key: "56", label: "Script", executionTypes: ["auto", "manual"] }],
  "68": [{ key: "28", label: "Script", executionTypes: ["auto", "manual"] }],
  "80": [{ key: "80", label: "Script", executionTypes: ["auto", "manual"] }],
  N25: [{ key: "N25", label: "N25", executionTypes: ["auto", "manual"] }],
  N31: [{ key: "N31", label: "Script", executionTypes: ["auto", "manual"] }],
  N33: [{ key: "N33", label: "Script", executionTypes: ["auto", "manual"] }],

  // 手動専用・PDF
  "30": [{ key: "30", label: "PDF", executionTypes: ["manual"] }],
  "37": [{ key: "37", label: "PDF", executionTypes: ["manual"] }],
  "45": [{ key: "45", label: "PDF", executionTypes: ["manual"] }],
  "48": [{ key: "48", label: "PDF", executionTypes: ["manual"] }],
  "54": [{ key: "54", label: "PDF", executionTypes: ["manual"] }],
  "60": [{ key: "60", label: "ロック状態", executionTypes: ["manual"] }],
  "62": [{ key: "62", label: "Script", executionTypes: ["manual"] }],
  "64": [{ key: "64", label: "Script", executionTypes: ["manual"] }],
  "66": [{ key: "66", label: "ロック状態", executionTypes: ["manual"] }],
  N12: [{ key: "N12", label: "Script", executionTypes: ["manual"] }],
  N27: [
    { key: "webedi_db", label: "webedi_db", executionTypes: ["manual"] },
    { key: "webedi", label: "webedi", executionTypes: ["manual"] },
  ],
  N28: [{ key: "webedi", label: "webedi", executionTypes: ["manual"] }],

  // イレギュラー運用
  E1: [{ key: "E1", label: "Script", executionTypes: ["manual"] }],
  E8: [{ key: "E8", label: "Script", executionTypes: ["manual"] }],
  E9: [{ key: "E9", label: "Script", executionTypes: ["manual"] }],
  E5: [
    { key: "E5", label: "Script1", executionTypes: ["manual"] },
    { key: "E55", label: "Script2", executionTypes: ["manual"] },
  ],
  E14: [{ key: "E14", label: "Script", executionTypes: ["manual"] }],
  E29: [{ key: "E29", label: "Script", executionTypes: ["manual"] }],
  E30: [{ key: "E30", label: "Script", executionTypes: ["manual"] }],
  E41: [{ key: "E41", label: "Script", executionTypes: ["manual"] }],
};

function normalizeKey(key: string): string {
  return key.trim().toUpperCase();
}

/**
 * Spreadsheet側の定義を優先して、実行キー一覧を取得する。
 */
export function getScriptKeysForOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): readonly OperationScriptKey[] {
  if (scriptKeys?.length) {
    return scriptKeys;
  }
  const normalized = normalizeKanriNo(kanriNo).toUpperCase();
  return DEFAULT_OPERATION_KEYS[normalized] ?? [];
}

/**
 * 対象管理NoまたはScriptKeysがPDFアップロード対象かを一元判定する。
 */
export function isPdfUploadOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): boolean {
  const keys = getScriptKeysForOperation(kanriNo, scriptKeys);
  return keys.some((k) => k.label?.toUpperCase() === "PDF");
}

/**
 * 実行キーに紐づく実行関数を取得する。
 */
export function getScriptRunner(scriptKey: string): ScriptRunnerFn | undefined {
  return SCRIPT_DEFINITIONS[normalizeKey(scriptKey)]?.run;
}

/**
 * 実行キーに紐づく実行要件を取得する。
 */
export function getScriptExecutionRequirement(
  scriptKey: string,
): ScriptExecutionRequirement {
  return {
    requiresFileSelection:
      SCRIPT_DEFINITIONS[normalizeKey(scriptKey)]?.requiresFileSelection ??
      false,
  };
}
