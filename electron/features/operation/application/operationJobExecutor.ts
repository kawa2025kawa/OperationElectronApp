// electron/features/operation/services/operationJobExecutor.ts

import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionStatus";
import {
  getStatus,
  updateStatus,
} from "@electron/features/operation/application/statusManager";
import {
  JOB_STATUS,
  type JobResult,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { getAutoScriptKeys } from "@shared/config/operationScriptRegistry";
import { executeSingleScriptJob } from "@electron/features/operation/runners/scriptRunner";

function isExecutableStatus(status?: string): boolean {
  return (
    status !== JOB_STATUS.RUNNING &&
    status !== JOB_STATUS.SCRIPT_RUNNING &&
    status !== JOB_STATUS.SUCCESS &&
    status !== JOB_STATUS.ERROR
  );
}

async function executeScript(
  kanriNo: string,
  scriptKey: string,
): Promise<JobResult> {
  updateStatus({
    kanriNo,
    status: JOB_STATUS.SCRIPT_RUNNING,
    startTime: new Date().toISOString(),
  });

  try {
    const result = await executeSingleScriptJob(kanriNo, scriptKey);

    applyScriptExecutionResult(kanriNo, result);

    return result;
  } catch (error) {
    applyScriptExecutionError(kanriNo, error);
    throw error;
  }
}

export async function executeReadyJob(item: OperationViewItem): Promise<void> {
  const kanriNo = item.kanriNo;
  const currentStatus = getStatus(kanriNo);

  if (!isExecutableStatus(currentStatus?.status)) {
    return;
  }

  const scriptKeys = getAutoScriptKeys(kanriNo);

  if (scriptKeys.length === 0) {
    return;
  }

  updateStatus({
    kanriNo,
    status: JOB_STATUS.RUNNING,
    startTime: new Date().toISOString(),
  });

  try {
    for (const scriptKey of scriptKeys) {
      const result = await executeScript(kanriNo, scriptKey);

      if (result.success === false) {
        return;
      }
    }
  } catch (error) {
    console.error(
      `[JobExecutor] ジョブ実行に失敗しました (kanriNo=${kanriNo}):`,
      error,
    );
  }
}
