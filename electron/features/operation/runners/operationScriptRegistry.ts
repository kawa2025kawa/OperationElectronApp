// electron/features/operation/runners/operationScriptRegistry.ts

import * as jobs from "@electron/features/operation/jobs/scripts";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type {
  JobResult,
  OperationScriptKey,
  OperationScriptKeyId,
  ScriptExecutionRequirement,
  ScriptFilePath,
} from "@shared/types/operation/operationTypes";

export type { ScriptExecutionRequirement, ScriptFilePath };

type ScriptRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

interface ScriptConfig {
  run: ScriptRunnerFn;
  requiresFileSelection?: boolean;
}

/** スクリプト実行定義テーブル */
const SCRIPT_DEFINITIONS: Readonly<
  Partial<Record<OperationScriptKeyId, ScriptConfig>>
> = {
  // Eシリーズ
  E1: { run: () => jobs.runJobE1() },
  E5: { run: (_, p) => jobs.runJobE5(p), requiresFileSelection: true },
  E55: { run: () => jobs.runJobE55() },
  E8: { run: () => jobs.runJobE8() },
  E9: { run: () => jobs.runJobE9() },
  E14: { run: (_, p) => jobs.runJobE14(p), requiresFileSelection: true },
  E29: { run: (_, p) => jobs.runJobE29(p), requiresFileSelection: true },
  E30: { run: (_, p) => jobs.runJobE30(p), requiresFileSelection: true },
  E41: { run: (_, p) => jobs.runJobE41(p), requiresFileSelection: true },

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

const makeKeys = (
  key: string,
  label = "Script",
  executionTypes: ("auto" | "manual")[] = ["auto", "manual"],
): readonly OperationScriptKey[] => [{ key, label, executionTypes }];

/** デフォルト対応表 */
const DEFAULT_OPERATION_KEYS: Readonly<
  Record<string, readonly OperationScriptKey[]>
> = {
  "114": makeKeys("114"),
  "16": makeKeys("16"),
  "20": makeKeys("20"),
  "25": makeKeys("25"),
  "28": makeKeys("28"),
  "34": makeKeys("34"),
  "39": makeKeys("39"),
  "43": makeKeys("28"),
  "56": makeKeys("56"),
  "68": makeKeys("28"),
  "80": makeKeys("80"),
  N25: makeKeys("N25", "N25"),
  N31: makeKeys("N31"),
  N33: makeKeys("N33"),

  "30": makeKeys("30", "PDF", ["manual"]),
  "37": makeKeys("37", "PDF", ["manual"]),
  "45": makeKeys("45", "PDF", ["manual"]),
  "48": makeKeys("48", "PDF", ["manual"]),
  "54": makeKeys("54", "PDF", ["manual"]),
  "60": makeKeys("60", "ロック状態", ["manual"]),
  "62": makeKeys("62", "Script", ["manual"]),
  "64": makeKeys("64", "Script", ["manual"]),
  "66": makeKeys("66", "ロック状態", ["manual"]),
  N12: makeKeys("N12", "Script", ["manual"]),
  N27: [
    { key: "webedi_db", label: "webedi_db", executionTypes: ["manual"] },
    { key: "webedi", label: "webedi", executionTypes: ["manual"] },
  ],
  N28: makeKeys("webedi", "webedi", ["manual"]),

  E1: makeKeys("E1", "Script", ["manual"]),
  E8: makeKeys("E8", "Script", ["manual"]),
  E9: makeKeys("E9", "Script", ["manual"]),
  E5: [
    { key: "E5", label: "Script1", executionTypes: ["manual"] },
    { key: "E55", label: "Script2", executionTypes: ["manual"] },
  ],
  E14: makeKeys("E14", "Script", ["manual"]),
  E29: makeKeys("E29", "Script", ["manual"]),
  E30: makeKeys("E30", "Script", ["manual"]),
  E41: makeKeys("E41", "Script", ["manual"]),
};

const normalizeKey = (k: string): OperationScriptKeyId =>
  k.trim().toUpperCase() as OperationScriptKeyId;

export function getScriptKeysForOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): readonly OperationScriptKey[] {
  return scriptKeys?.length
    ? scriptKeys
    : (DEFAULT_OPERATION_KEYS[normalizeKanriNo(kanriNo).toUpperCase()] ?? []);
}

export function isPdfUploadOperation(
  kanriNo: string,
  scriptKeys?: readonly OperationScriptKey[] | null,
): boolean {
  return getScriptKeysForOperation(kanriNo, scriptKeys).some(
    (k) => k.label?.toUpperCase() === "PDF",
  );
}

export const getScriptRunner = (
  scriptKey: string,
): ScriptRunnerFn | undefined =>
  SCRIPT_DEFINITIONS[normalizeKey(scriptKey)]?.run;

export const getScriptExecutionRequirement = (
  scriptKey: string,
): ScriptExecutionRequirement => ({
  requiresFileSelection:
    SCRIPT_DEFINITIONS[normalizeKey(scriptKey)]?.requiresFileSelection ?? false,
});
