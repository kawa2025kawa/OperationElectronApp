// electron/features/operation/application/operationCommandService.ts

import {
  clearJsonMasterDataCache,
  getJsonMasterData,
} from "@electron/features/masterData/application/jsonMasterDataManager";
import { setActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  registerTargets,
  refreshDependencyStatuses,
  resetAllStatusesToScheduled,
  updateManualStatus,
} from "@electron/features/operation/application/statusManager";
import type { StatusTarget } from "@electron/features/operation/application/statusNotifier";
import type {
  ActiveFlags,
  JobStatus,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";

export async function registerOperationTargets(): Promise<void> {
  const masterData = await getJsonMasterData();

  const targets: StatusTarget[] = [
    ...masterData.operations.map((target) => ({
      ...target,
      targetType: "operation" as const,
    })),
    ...masterData.todayIrregulars.map((target) => ({
      ...target,
      targetType: "today" as const,
    })),
  ];

  registerTargets(targets, masterData);
}

export async function resetOperationStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  const result = resetAllStatusesToScheduled();

  await clearJsonMasterDataCache();

  return result;
}

export function updateOperationActiveFlags(flags: Partial<ActiveFlags>): void {
  setActiveFlags(flags);
  refreshDependencyStatuses();
}

export function updateOperationJobStatus(input: {
  kanriNo: string;
  status: JobStatus;
  comment?: string;
}): void {
  updateManualStatus(input.kanriNo, input.status, input.comment ?? "");
}
