// electron/features/operation/runners/scriptRunner.ts

import {
  JOB_STATUS,
  type JobResult,
  type OperationItem,
} from "@shared/types/operation";
import { hasJobId } from "@electron/features/operation/polling/trackerMonitor";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";
import { cleanErrorMessage } from "@electron/features/operation/helpers/errorHelper";

// 既存の Job インポート群
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

async function dispatchScript(
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobOptions,
): Promise<JobResult> {
  const normalized = String(kanriNo).trim().toLowerCase();
  const runner = jobRunners[normalized];
  if (!runner) {
    throw new Error(`未定義のスクリプトキー: ${kanriNo}`);
  }
  const result = await runner(normalized, filePath, options);
  return typeof result === "string" ? { message: result } : result;
}

const runningScriptJobs = new Set<string>();
let isTriggeringScript = false;

/**
 * 🎯 autoStart が true かどうか判定するヘルパー
 */
function isAutoStartEnabled(item: OperationItem): boolean {
  // 1. item 直下の autoStart が指定されている場合
  if (typeof item.autoStart === "boolean") {
    return item.autoStart;
  }
  // 2. scripts 配下に autoStart が指定されている場合
  if (Array.isArray(item.scripts) && item.scripts.length > 0) {
    return item.scripts.some((s) => s.autoStart === true);
  }
  return false;
}

export async function executeScriptJob(
  rawKanriNo: string | number,
  filePath?: ScriptFilePath,
): Promise<JobResult> {
  const kanriNo = String(rawKanriNo).trim();
  if (!kanriNo) throw new Error("kanriNo is required");
  if (runningScriptJobs.has(kanriNo)) throw new Error(`実行中: No.${kanriNo}`);

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

    const dsi8020Item = getStatus("DSI8020");
    const scriptOptions: JobOptions = {
      dsi8020Status: dsi8020Item?.status ?? undefined,
    };

    const result = await dispatchScript(kanriNo, filePath, scriptOptions);
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
    console.error("[ScriptRunner ERROR]", { kanriNo, error });
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

/**
 * ⚡【イベント駆動】READYステータス検知時の即時 Script 起動
 */
export async function executeScriptJobImmediately(
  item: OperationItem,
): Promise<void> {
  if (hasJobId(item)) return; // JCジョブは対象外

  const kanriNo = String(item.kanriNo).trim();
  if (runningScriptJobs.has(kanriNo)) return;

  // 🎯 autoStart が false または未定義の場合は自動実行しない
  if (!isAutoStartEnabled(item)) {
    return;
  }

  const currentStatus = getStatus(kanriNo)?.status;
  if (currentStatus === JOB_STATUS.READY) {
    await executeScriptJob(kanriNo).catch((error) => {
      console.error("[ScriptRunner] Immediate execution FAILED", {
        kanriNo,
        error: cleanErrorMessage(error),
      });
    });
  }
}

/**
 * ⏰【タイマー駆動】60秒周期の定期チェック（取りこぼし安全網）
 */
export async function triggerAutoStartScriptJobs(
  targets: OperationItem[],
  runningCheck: () => boolean,
): Promise<void> {
  if (isTriggeringScript || !runningCheck()) return;
  isTriggeringScript = true;

  try {
    for (const item of targets) {
      if (!runningCheck()) break;

      const kanriNo = String(item.kanriNo).trim();
      const currentStatus = getStatus(kanriNo)?.status;

      if (
        currentStatus === JOB_STATUS.READY &&
        !hasJobId(item) &&
        isAutoStartEnabled(item) && // 🎯 autoStart === true の場合のみ
        !runningScriptJobs.has(kanriNo)
      ) {
        void executeScriptJob(kanriNo).catch((error) => {
          console.error("[ScriptRunner] Auto-start FAILED", {
            kanriNo,
            error: cleanErrorMessage(error),
          });
        });
      }
    }
  } finally {
    isTriggeringScript = false;
  }
}
