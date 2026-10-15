// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import * as jobs from "@electron/features/operation/jobs/scripts";
import type { JobResult } from "@shared/types/operation/operationTypes";

export type ScriptFilePath = string | string[];

type JobRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
) => Promise<string | JobResult>;

const JOB_RUNNERS: Readonly<Record<string, JobRunnerFn>> = {
  // Numeric
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

  // E Series
  e5: (_, filePath) => jobs.runJobE5(filePath),
  e55: () => jobs.runJobE55(),
  e8: () => jobs.runJobE8(),
  e9: () => jobs.runJobE9(),
  e14: (_, filePath) => jobs.runJobE14(filePath),
  e29: (_, filePath) => jobs.runJobE29(filePath),
  e30: (_, filePath) => jobs.runJobE30(filePath),
  e41: (_, filePath) => jobs.runJobE41(filePath),

  // N Series
  n12: jobs.runJobN12,
  n20: jobs.runJobN20,
  n25: jobs.runJobN25,
  n31: jobs.runJobN31,
  n33: jobs.runJobN33,

  // RDP
  webedi_db: () => jobs.runJobRdp("WEBEDI_DB"),
  webedi: () => jobs.runJobRdp("WEBEDI"),
};

function cleanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error.replace(/\x1B\[[0-9;]*[mK]/g, "").trim();
  }
  return String(error ?? "不明なエラーが発生しました");
}

function toJobResult(result: string | JobResult): JobResult {
  if (typeof result === "string") {
    return {
      success: true,
      kind: "success",
      message: result || "正常終了",
    };
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
  const cleanKanriNo = normalizeKanriNo(kanriNo);
  const cleanKey = targetKey.trim().toLowerCase();

  if (!cleanKey) {
    return {
      success: false,
      kind: "error",
      message: `スクリプトキーが指定されていません (No.${cleanKanriNo})`,
    };
  }

  const runner = Object.prototype.hasOwnProperty.call(JOB_RUNNERS, cleanKey)
    ? JOB_RUNNERS[cleanKey]
    : undefined;

  try {
    if (runner) {
      const result = await runner(cleanKanriNo, filePath);
      return toJobResult(result);
    }

    const rdpResult = await jobs.runJobRdp(targetKey.trim().toUpperCase());
    return toJobResult(rdpResult);
  } catch (error: unknown) {
    const errorDetail = cleanErrorMessage(error);

    return {
      success: false,
      kind: "error",
      message: runner
        ? `エラー: ${errorDetail}`
        : `スクリプト/RDP実行失敗: No.${cleanKanriNo} (target="${cleanKey}") - ${errorDetail}`,
    };
  }
}
