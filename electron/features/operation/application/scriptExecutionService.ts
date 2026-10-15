// electron/features/operation/application/scriptExecutionService.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  applyScriptExecutionError,
  applyScriptExecutionResult,
} from "@electron/features/operation/application/scriptExecutionStatus";
import {
  getDependencyMasters,
  getDependencyStatuses,
  updateManualStatus,
} from "@electron/features/operation/application/statusManager";
import { validateScriptExecutionInput } from "@electron/features/operation/application/scriptExecutionRequirements";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { runScriptWithZipRecovery } from "@electron/features/operation/infrastructure/recovery/zipRecoveryHelper";
import {
  JOB_STATUS,
  type JobResult,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatMissingKanriNos,
} from "@shared/utils/dependency/dependencyUtils";

export interface ManualScriptExecutionInput {
  kanriNo: string;
  scriptKey?: string;
  filePath?: string | string[];
  ignoreDependencies?: boolean;
}

function validateJobDependencies(kanriNo: string): void {
  const dependencyResult = checkJobDependencies(
    kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  if (dependencyResult.ok) {
    return;
  }

  const missingNos = formatMissingKanriNos(
    dependencyResult.missingDependencies,
  );

  const message =
    missingNos.length > 0
      ? `未完了前作業 (No.${missingNos})`
      : "未完了前作業あり";

  updateManualStatus(kanriNo, JOB_STATUS.ERROR, message);
  throw new Error(message);
}

export async function executeManualScript(
  input: ManualScriptExecutionInput,
): Promise<JobResult> {
  const kanriNo = normalizeKanriNo(input.kanriNo);
  const scriptKey = input.scriptKey?.trim() || kanriNo;

  if (!input.ignoreDependencies) {
    validateJobDependencies(kanriNo);
  }

  try {
    validateScriptExecutionInput(scriptKey, input.filePath);

    const result = await runScriptWithZipRecovery(
      kanriNo,
      scriptKey,
      input.filePath,
    );

    applyScriptExecutionResult(kanriNo, result);

    return result;
  } catch (error: unknown) {
    applyScriptExecutionError(kanriNo, error);
    throw error;
  }
}
