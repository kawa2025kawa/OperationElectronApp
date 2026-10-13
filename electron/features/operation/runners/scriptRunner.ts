// electron/features/operation/runners/scriptRunner.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { cleanErrorMessage } from "@electron/features/operation/utils/errorHelper";
import * as jobs from "@electron/features/operation/jobs/scripts";
import type { JobResult } from "@shared/types/operation/operationTypes";

export type ScriptFilePath = string | string[];

interface JobOptions {
  [key: string]: unknown;
}

type JobRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobOptions,
) => Promise<string | JobResult>;

interface ParsedScriptEntry {
  key: string;
  runnerKey: string;
}

const EMPTY_SCRIPT_VALUES = new Set(["", "-", "ー"]);

const JOB_RUNNERS: Readonly<Record<string, JobRunnerFn>> = {
  // 数字系
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

  // Eシリーズ
  e5: (_, filePath) => jobs.runJobE5(filePath),
  e55: () => jobs.runJobE55(),
  e8: () => jobs.runJobE8(),
  e9: () => jobs.runJobE9(),
  e14: (_, filePath) => jobs.runJobE14(filePath),
  e29: (_, filePath) => jobs.runJobE29(filePath),
  e30: (_, filePath) => jobs.runJobE30(filePath),
  e41: (_, filePath) => jobs.runJobE41(filePath),

  // Nシリーズ
  n12: jobs.runJobN12,
  n20: jobs.runJobN20,
  n25: jobs.runJobN25,
  n31: jobs.runJobN31,
  n33: jobs.runJobN33,

  // RDPフォールバック系
  webedi_db: () => jobs.runJobRdp("WEBEDI_DB"),
  webedi: () => jobs.runJobRdp("WEBEDI"),
};

function normalizeScriptKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeScriptTarget(value: string): string {
  return value.trim();
}

function toJobResult(result: string | JobResult): JobResult {
  if (typeof result === "string") {
    return {
      success: true,
      message: result || "処理完了",
    };
  }

  return {
    success: result.success !== false,
    message: result.message || "処理完了",
  };
}

function createFailureResult(error: unknown): JobResult {
  return {
    success: false,
    message: `エラー: ${cleanErrorMessage(error)}`,
  };
}

export function parseScriptEntries(input?: string): ParsedScriptEntry[] {
  if (!input || EMPTY_SCRIPT_VALUES.has(input.trim())) {
    return [];
  }

  return input
    .split(/[,;\n\r]+/)
    .map((item): ParsedScriptEntry | null => {
      const trimmed = item.trim();

      if (!trimmed) {
        return null;
      }

      const separatorIndex = trimmed.indexOf(":");

      const rawKey =
        separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;

      const rawTarget =
        separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : trimmed;

      return {
        key: normalizeScriptKey(rawKey),
        runnerKey: normalizeScriptKey(rawTarget),
      };
    })
    .filter((entry): entry is ParsedScriptEntry => entry !== null);
}

export async function executeSingleScriptJob(
  kanriNo: string,
  targetKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const cleanKanriNo = normalizeKanriNo(kanriNo);
  const cleanKey = normalizeScriptKey(targetKey);
  const runner = JOB_RUNNERS[cleanKey];

  try {
    if (runner) {
      const result = await runner(cleanKanriNo, filePath);
      return toJobResult(result);
    }

    const message = await jobs.runJobRdp(
      normalizeScriptTarget(targetKey).toUpperCase(),
    );

    return {
      success: true,
      message,
    };
  } catch (error: unknown) {
    if (!runner) {
      return {
        success: false,
        message: `対象のスクリプトキーが見つかりません: No.${cleanKanriNo} (target="${cleanKey}")`,
      };
    }

    return createFailureResult(error);
  }
}
