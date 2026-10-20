// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import * as jobs from "@electron/features/operation/jobs/scripts";
import { startRdpSession } from "@electron/features/rdp/rdpService";
import type { JobResult } from "@shared/types/operation/operationTypes";

export type ScriptFilePath = string | string[];

type JobRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

// ローカル（Node/Playwright等）で動かすプログラムスクリプトのみを登録するマップ
const SCRIPT_JOBS: Record<string, JobRunnerFn> = {
  // --- Eシリーズ ---
  E1: () => jobs.runJobE1(),
  E5: (_, filePath) => jobs.runJobE5(filePath),
  E55: () => jobs.runJobE55(),
  E8: () => jobs.runJobE8(),
  E9: () => jobs.runJobE9(),
  E14: (_, filePath) => jobs.runJobE14(filePath),
  E29: (_, filePath) => jobs.runJobE29(filePath),
  E30: (_, filePath) => jobs.runJobE30(filePath),
  E41: (_, filePath) => jobs.runJobE41(filePath),

  // --- Nシリーズ ---
  N12: jobs.runJobN12,
  N20: jobs.runJobN20,
  N25: jobs.runJobN25,
  N31: jobs.runJobN31,
  N33: jobs.runJobN33,

  // --- Numericシリーズ ---
  "114": jobs.runJob114,
  "16": jobs.runJob16,
  "20": jobs.runJob20,
  "25": jobs.runJob25,
  "28": jobs.runJob28,
  "43": jobs.runJob28,
  "68": jobs.runJob28,
  "34": jobs.runJob34,
  "39": jobs.runJob39,
  "56": jobs.runJob56,
  "62": jobs.runJob62,
  "64": jobs.runJob64,
  "66": jobs.runJob66,
  "80": jobs.runJob80,
};

function cleanErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string")
    return error.replace(/\x1B\[[0-9;]*[mK]/g, "").trim();
  return String(error ?? "不明なエラーが発生しました");
}

function toJobResult(result: string | JobResult): JobResult {
  if (typeof result === "string") {
    return { success: true, kind: "success", message: result || "正常終了" };
  }
  const success = result.success !== false;
  return {
    ...result,
    success,
    kind: result.kind ?? (success ? "success" : "error"),
    message: result.message || (success ? "正常終了" : "エラー"),
  };
}

export async function executeSingleScriptJob(
  kanriNo: string,
  targetKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const cleanKanriNo = normalizeKanriNo(kanriNo).toUpperCase();
  const cleanKey = targetKey.trim().toUpperCase();

  if (!cleanKey) {
    return {
      success: false,
      kind: "error",
      message: `スクリプトキーが指定されていません (No.${cleanKanriNo})`,
    };
  }

  // 1. ローカルコード（Node/Playwright等）のマップから targetKey / kanriNo で検索
  const runner = SCRIPT_JOBS[cleanKey] ?? SCRIPT_JOBS[cleanKanriNo];

  try {
    if (typeof runner === "function") {
      const result = await runner(cleanKanriNo, filePath);
      return toJobResult(result);
    }

    // 2. ローカルコードに登録がない場合は、targetKey ("WEBEDI_DB" や "WEBEDI") をそのまま RDP マスタの name として接続
    const rdpMessage = await startRdpSession(cleanKey);
    return toJobResult(rdpMessage);
  } catch (error: unknown) {
    const errorDetail = cleanErrorMessage(error);
    return {
      success: false,
      kind: "error",
      message: `エラー: ${errorDetail}`,
    };
  }
}
