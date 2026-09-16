// src/renderer/features/operation/services/operationSummaryService.ts
import type { AppState } from "@renderer/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operation";
import {
  calculateSummary,
  getAllEntitiesArray,
} from "@renderer/features/operation/helpers/operationEntities";

export function refreshSummary(state: AppState): void {
  state.summary = calculateSummary(getAllEntitiesArray(state), {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  });
}

export function filterSummaryItems(
  state: AppState,
  label: string,
): OperationItem[] {
  const normalizedLabel = label.trim().toLowerCase();
  const items = getAllEntitiesArray(state);

  switch (normalizedLabel) {
    case "total":
      return items;
    case "progress":
      return items.filter((item) => {
        const status = item.status?.toLowerCase();
        return (
          status === JOB_STATUS.RUNNING.toLowerCase() ||
          status === JOB_STATUS.SCRIPT_RUNNING.toLowerCase()
        );
      });
    default:
      return items.filter(
        (item) => item.status?.toLowerCase() === normalizedLabel,
      );
  }
}
