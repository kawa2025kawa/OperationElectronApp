// electron/features/operation/application/operationLifecycleService.ts

import {
  clearJsonMasterDataCache,
  getJsonMasterData,
} from "@electron/features/masterData/application/jsonMasterDataManager";
import { clearSpreadsheetMasterDataCache } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  getAllStatuses,
  registerTargets,
  resetAllStatusesAndTargets,
  saveStatusesImmediately,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";

// マスターから運用ターゲットを構築し、ステータス管理へ登録する。
export async function registerOperationTargets(): Promise<void> {
  const masterData = await getJsonMasterData();

  const targetList: StatusTarget[] = [
    ...masterData.operations.map((target) => ({
      ...target,
      targetType: "operation" as const,
    })),
    ...masterData.todayIrregulars.map((target) => ({
      ...target,
      targetType: "today" as const,
    })),
  ];

  registerTargets(targetList, masterData);
}

// マスターキャッシュと運用状態をリセットし、マスターを再取得して状態を再構築する。
export async function resetOperationStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  await clearJsonMasterDataCache();
  await clearSpreadsheetMasterDataCache();
  await resetAllStatusesAndTargets();
  await registerOperationTargets();
  saveStatusesImmediately();

  return getAllStatuses();
}
