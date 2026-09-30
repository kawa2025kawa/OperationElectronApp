// electron/features/operation/services/operationJobExecutor.ts

import { getAutoScriptKeys } from "@electron/features/operation/config/operationScriptRegistry";
import { normalizeKanriNo } from "@electron/features/operation/helpers/operationUtils";
import {
  executeSingleScriptJob,
  parseScriptEntries,
} from "@electron/features/operation/runners/scriptRunner";
import {
  getStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/statusManager";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

interface Runner {
  key: string;
  runnerKey: string;
}

interface ScriptExecutionResult {
  success: boolean;
  messages: string[];
}

const runningScriptJobs = new Set<string>();

function buildRunners(scriptKeys: string[]): Runner[] {
  return scriptKeys.flatMap((scriptKey) => {
    const entries = parseScriptEntries(scriptKey);

    if (entries.length > 0) {
      return entries.map(({ key, runnerKey }) => ({
        key,
        runnerKey,
      }));
    }

    const key = scriptKey.toLowerCase();

    return [
      {
        key,
        runnerKey: key,
      },
    ];
  });
}

async function executeRunners(
  kanriNo: string,
  runners: Runner[],
): Promise<ScriptExecutionResult> {
  const messages: string[] = [];

  for (const { key, runnerKey } of runners) {
    const result = await executeSingleScriptJob(kanriNo, runnerKey);

    if (result.message) {
      messages.push(`[${key}] ${result.message}`);
    }

    if (result.success === false) {
      return {
        success: false,
        messages,
      };
    }
  }

  return {
    success: true,
    messages,
  };
}

function applyExecutionResult(
  kanriNo: string,
  result: ScriptExecutionResult,
): void {
  updateStatus({
    kanriNo,
    status: result.success ? JOB_STATUS.SUCCESS : JOB_STATUS.ERROR,
    endTime: new Date().toISOString(),
    comment:
      result.messages.join("\n") ||
      (result.success ? "自動実行完了" : "自動実行失敗"),
  });
}

function applyExecutionError(kanriNo: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  updateStatus({
    kanriNo,
    status: JOB_STATUS.ERROR,
    endTime: new Date().toISOString(),
    comment: `実行エラー: ${message}`,
  });
}

export async function executeReadyJob(target: StatusTarget): Promise<void> {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  if (!kanriNo) {
    return;
  }

  if (runningScriptJobs.has(kanriNo)) {
    return;
  }

  const scriptKeys = getAutoScriptKeys(kanriNo);

  if (scriptKeys.length === 0) {
    return;
  }

  const currentStatus = getStatus(kanriNo)?.status;

  if (
    currentStatus === JOB_STATUS.RUNNING ||
    currentStatus === JOB_STATUS.SCRIPT_RUNNING ||
    currentStatus === JOB_STATUS.SUCCESS ||
    currentStatus === JOB_STATUS.ERROR
  ) {
    return;
  }

  const runners = buildRunners(scriptKeys);

  if (runners.length === 0) {
    return;
  }

  runningScriptJobs.add(kanriNo);

  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
    comment: "自動スクリプト実行中...",
  });

  try {
    const result = await executeRunners(kanriNo, runners);

    applyExecutionResult(kanriNo, result);
  } catch (error) {
    console.error(
      `[JobExecutor] Script execution error (kanriNo=${kanriNo}):`,
      error,
    );

    applyExecutionError(kanriNo, error);
  } finally {
    runningScriptJobs.delete(kanriNo);
  }
}
