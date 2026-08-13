// src/shared/store/slices/helpers/persistedStatus.ts

import type { OperationItem } from "@shared/types/operationType";

import { mergeStatus } from "./statusFactory";

type OperationEntities = Record<string, OperationItem>;

export const applyPersistedStatuses = (
  entities: OperationEntities,
  statuses: OperationEntities,
): OperationEntities => {
  const result = {
    ...entities,
  };

  for (const [kanriNo, status] of Object.entries(statuses)) {
    const entity = result[kanriNo];

    if (!entity) {
      continue;
    }

    mergeStatus(entity, status);
  }

  return result;
};
