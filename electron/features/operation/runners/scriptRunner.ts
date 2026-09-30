// electron/features/operation/runners/scriptRunner.ts

import { cleanErrorMessage } from "@electron/features/operation/helpers/errorHelper";
import { normalizeKanriNo } from "@electron/features/operation/helpers/operationUtils";

import { runJobE14 } from "@electron/features/operation/jobs/scripts/eseries/job_e14";
import { runJobE29 } from "@electron/features/operation/jobs/scripts/eseries/job_e29";
import { runJobE30 } from "@electron/features/operation/jobs/scripts/eseries/job_e30";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { runJobE5 } from "@electron/features/operation/jobs/scripts/eseries/job_e5";
import { runJobE5Check } from "@electron/features/operation/jobs/scripts/eseries/job_e5_check";
import { runJobE8 } from "@electron/features/operation/jobs/scripts/eseries/job_e8";
import { runJobE9 } from "@electron/features/operation/jobs/scripts/eseries/job_e9";

import { runJobN12 } from "@electron/features/operation/jobs/scripts/nseries/job_n12";
import { runJobN20 } from "@electron/features/operation/jobs/scripts/nseries/job_n20";
import { runJobN25 } from "@electron/features/operation/jobs/scripts/nseries/job_n25";
import { runJobN31 } from "@electron/features/operation/jobs/scripts/nseries/job_n31";
import { runJobN33 } from "@electron/features/operation/jobs/scripts/nseries/job_n33";

import { runJob114 } from "@electron/features/operation/jobs/scripts/numeric/job_114";
import { runJob16 } from "@electron/features/operation/jobs/scripts/numeric/job_16";
import { runJob20 } from "@electron/features/operation/jobs/scripts/numeric/job_20";
import { runJob25 } from "@electron/features/operation/jobs/scripts/numeric/job_25";
import { runJob28 } from "@electron/features/operation/jobs/scripts/numeric/job_28";
import { runJob34 } from "@electron/features/operation/jobs/scripts/numeric/job_34";
import { runJob39 } from "@electron/features/operation/jobs/scripts/numeric/job_39";
import { runJob56 } from "@electron/features/operation/jobs/scripts/numeric/job_56";
import { runJob62 } from "@electron/features/operation/jobs/scripts/numeric/job_62";
import { runJob64 } from "@electron/features/operation/jobs/scripts/numeric/job_64";
import { runJob66 } from "@electron/features/operation/jobs/scripts/numeric/job_66";
import { runJob80 } from "@electron/features/operation/jobs/scripts/numeric/job_80";

import { type JobResult } from "@shared/types/operation/operationTypes";

export type ScriptFilePath = string | string[];

interface JobOptions {
  [key: string]: unknown;
}

type JobRunnerFn = (
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobOptions,
) => Promise<string | JobResult>;

const jobRunners: Record<string, JobRunnerFn> = {
  "114": runJob114,
  "16": runJob16,
  "20": runJob20,
  "25": runJob25,
  "28": runJob28,
  "43": runJob28,
  "68": runJob28,
  "34": runJob34,
  "39": runJob39,
  "56": runJob56,
  "62": runJob62,
  "64": runJob64,
  "66": runJob66,
  "80": runJob80,
  e5: (_, filePath) => runJobE5(filePath),
  e5_check: () => runJobE5Check(),
  e8: () => runJobE8(),
  e9: () => runJobE9(),
  e14: (_, filePath) => runJobE14(filePath),
  e29: (_, filePath) => runJobE29(filePath),
  e30: (_, filePath) => runJobE30(filePath),
  e41: (_, filePath) => runJobE41(filePath),
  n12: runJobN12,
  n20: runJobN20,
  n25: runJobN25,
  n31: runJobN31,
  n33: runJobN33,
};

export interface ParsedScriptEntry {
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

    if (jobRunners[runnerKey]) {
      entries.push({ key, runnerKey });
    }
  }

  return entries;
}

export async function executeSingleScriptJob(
  kanriNo: string,
  targetKey: string,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const cleanKanriNo = normalizeKanriNo(kanriNo);
  const cleanKey = targetKey.trim().toLowerCase();

  const fn = jobRunners[cleanKey];

  if (!fn) {
    return {
      success: false,
      message: `対象のスクリプトキーが見つかりません: No.${cleanKanriNo} (target="${cleanKey}")`,
    };
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

