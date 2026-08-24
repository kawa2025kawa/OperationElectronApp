// src/renderer/features/operation/helpers/operationDataFactory.ts

import type { OperationItem } from "@shared/types/operationType";
import { isIrregularToday } from "@shared/utils/isIrregularToday";
import { applyPersistedStatuses } from "./operationEntities";
import { mapRawEntities } from "./operationSummary";

export interface InitializedOperationData {
  operationIds: string[];
  operationEntities: Record<string, OperationItem>;
  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;
  todayIds: string[];
}

export function buildInitialOperationData(
  operations: OperationItem[],
  irregulars: OperationItem[],
  statuses: Record<string, OperationItem>,
): InitializedOperationData {
  return {
    operationIds: operations.map(({ kanriNo }) => String(kanriNo)),
    operationEntities: applyPersistedStatuses(
      mapRawEntities(operations),
      statuses,
    ),
    irregularIds: irregulars.map(({ kanriNo }) => String(kanriNo)),
    irregularEntities: applyPersistedStatuses(
      mapRawEntities(irregulars),
      statuses,
    ),
    todayIds: irregulars
      .filter(isIrregularToday)
      .map(({ kanriNo }) => String(kanriNo)),
  };
}
