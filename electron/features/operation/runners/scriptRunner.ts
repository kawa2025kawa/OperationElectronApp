// electron/features/operation/runners/scriptRunner.ts

import {
  JOB_STATUS,
  type JobResult,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import { hasJobId } from "@electron/features/operation/services/trackerServiceClient";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";
import { cleanErrorMessage } from "@electron/features/operation/helpers/errorHelper";

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

import { runJobE5 } from "@electron/features/operation/jobs/scripts/eseries/job_e5";
import { runJobE5Check } from "@electron/features/operation/jobs/scripts/eseries/job_e5_check";
import { runJobE8 } from "@electron/features/operation/jobs/scripts/eseries/job_e8";
import { runJobE9 } from "@electron/features/operation/jobs/scripts/eseries/job_e9";
import { runJobE14 } from "@electron/features/operation/jobs/scripts/eseries/job_e14";
import { runJobE29 } from "@electron/features/operation/jobs/scripts/eseries/job_e29";
import { runJobE30 } from "@electron/features/operation/jobs/scripts/eseries/job_e30";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";

import { runJobN12 } from "@electron/features/operation/jobs/scripts/nseries/job_n12";
import { runJobN20 } from "@electron/features/operation/jobs/scripts/nseries/job_n20";
import { runJobN25 } from "@electron/features/operation/jobs/scripts/nseries/job_n25";
import { runJobN31 } from "@electron/features/operation/jobs/scripts/nseries/job_n31";
import { runJobN33 } from "@electron/features/operation/jobs/scripts/nseries/job_n33";

type ScriptFilePath = string | string[];

export interface JobOptions {
  dsi8020Status?: string;
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
  e5: (_, fp) => runJobE5(fp),
  e5_check: () => runJobE5Check(),
  e8: () => runJobE8(),
  e9: () => runJobE9(),
  e14: (_, fp) => runJobE14(fp),
  e29: (_, fp) => runJobE29(fp),
  e30: (_, fp) => runJobE30(fp),
  e41: (_, fp) => runJobE41(fp),
  n12: runJobN12,
  n20: runJobN20,
  n25: runJobN25,
  n31: runJobN31,
  n33: runJobN33,
};

const runningScriptJobs = new Set<string>();

export async function executeScriptJob(
  rawKanriNo: string | number,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const kanriNo = String(rawKanriNo);
  if (!kanriNo) throw new Error("kanriNo is required");
  if (runningScriptJobs.has(kanriNo)) throw new Error(`実行中: No.${kanriNo}`);

  const runner = jobRunners[kanriNo.toLowerCase()];
  if (!runner) throw new Error(`未定義のスクリプトキー: ${kanriNo}`);

  runningScriptJobs.add(kanriNo);
  const isReadOnlyCheckJob = kanriNo.toUpperCase().endsWith("_CHECK");
  const startTime = new Date().toISOString();

  try {
    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.SCRIPT_RUNNING,
        comment: "スクリプト実行中...",
        startTime,
      });
    }

    const scriptOptions: JobOptions = {
      dsi8020Status: getStatus("DSI8020")?.status,
    };

    const rawResult = await runner(kanriNo, filePath, scriptOptions);
    const result =
      typeof rawResult === "string" ? { message: rawResult } : rawResult;
    const endTime = new Date().toISOString();

    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.SUCCESS,
        comment: result.message,
        startTime,
        endTime,
      });
    }

    return result;
  } catch (error) {
    const formattedError = cleanErrorMessage(error);
    const endTime = new Date().toISOString();

    if (!isReadOnlyCheckJob) {
      updateStatus({
        kanriNo,
        status: JOB_STATUS.ERROR,
        comment: formattedError,
        startTime,
        endTime,
      });
    }
    throw new Error(formattedError, { cause: error });
  } finally {
    runningScriptJobs.delete(kanriNo);
  }
}

export async function executeScriptJobImmediately(
  item: OperationItem,
): Promise<void> {
  if (hasJobId(item) || item.executionType !== "autoScript") return;

  const kanriNo = String(item.kanriNo);
  if (runningScriptJobs.has(kanriNo)) return;

  if (getStatus(kanriNo)?.status === JOB_STATUS.READY) {
    await executeScriptJob(kanriNo).catch(() => {});
  }
}
