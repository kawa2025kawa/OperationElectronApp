//electron\features\operation\runners\scriptRunner.ts

import { cleanErrorMessage } from "@electron/features/operation/utils/errorHelper";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";

// 全ジョブ関数を1行で一括インポート
import * as jobs from "@electron/features/operation/jobs/scripts";

import { type JobResult } from "@shared/types/operation/operationTypes";
import { type ScriptKey } from "@shared/config/operationScriptRegistry";

export type ScriptFilePath = string | string[];

interface JobOptions {
  [key: string]: unknown;
}

type JobRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobOptions,
) => Promise<string | JobResult>;

const jobRunners: Partial<Record<ScriptKey, JobRunnerFn>> = {
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
  e5_check: () => jobs.runJobE5Check(),
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

interface ParsedScriptEntry {
  key: string;
  runnerKey: string;
}

export function parseScriptEntries(input?: string): ParsedScriptEntry[] {
  if (!input || input === "-" || input === "ー") {
    return [];
  }

  const items = input.split(/[,;\n\r]+/);
  const entries: ParsedScriptEntry[] = [];

  for (const item of items) {
    const trimmed = item.trim();

    if (!trimmed) {
      continue;
    }

    const [rawKey, rawTarget] = trimmed.includes(":")
      ? trimmed.split(":")
      : [trimmed, trimmed];

    const key = rawKey.trim().toLowerCase();
    const runnerKey = rawTarget.trim().toLowerCase();

    entries.push({ key, runnerKey });
  }

  return entries;
}

export async function executeSingleScriptJob(
  kanriNo: string,
  targetKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const cleanKanriNo = normalizeKanriNo(kanriNo);
  const cleanKey = targetKey.trim().toLowerCase() as ScriptKey;

  const fn = jobRunners[cleanKey];

  if (!fn) {
    try {
      const message = await jobs.runJobRdp(targetKey.toUpperCase());
      return {
        success: true,
        message,
      };
    } catch {
      return {
        success: false,
        message: `対象のスクリプトキーが見つかりません: No.${cleanKanriNo} (target="${cleanKey}")`,
      };
    }
  }

  try {
    const rawResult = await fn(cleanKanriNo, filePath);

    const msg = typeof rawResult === "string" ? rawResult : rawResult.message;

    const isSuccess =
      typeof rawResult === "string" ? true : rawResult.success !== false;

    return {
      success: isSuccess,
      message: msg || "処理完了",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: `エラー: ${cleanErrorMessage(error)}`,
    };
  }
}
