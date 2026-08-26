import type { AppState } from "@shared/store";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import { getAllEntities as getAllEntitiesMap } from "@renderer/features/operation/helpers/operationEntities";
import {
  calculateSummary,
  getAllEntities as getAllEntitiesArray,
} from "@renderer/features/operation/helpers/operationSummary";
import { calculateNextStatus } from "@renderer/features/operation/helpers/statusEvaluator";

export function refreshSummary(state: AppState): void {
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  state.summary = calculateSummary(getAllEntitiesArray(state), activeFlags);
}

export function filterSummaryItems(
  state: AppState,
  label: string,
): OperationItem[] {
  const lowerLabel = label.toLowerCase();
  const targetItems = getAllEntitiesArray(state);

  if (lowerLabel === "total") {
    return targetItems;
  }

  if (lowerLabel === "progress") {
    return targetItems.filter((item: OperationItem) => {
      const status = item.status ? String(item.status).toLowerCase() : "";
      return status === "running" || status === "scriptrunning";
    });
  }

  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  const allEntitiesMap = getAllEntitiesMap(state);

  return targetItems.filter((item: OperationItem) => {
    const currentStatus = (
      item.status ? String(item.status).toLowerCase() : ""
    ) as JobStatus;

    return (
      calculateNextStatus(item, currentStatus, allEntitiesMap, activeFlags) ===
      lowerLabel
    );
  });
}
