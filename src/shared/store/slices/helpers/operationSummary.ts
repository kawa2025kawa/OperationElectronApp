// src/shared/store/slices/helpers/operationSummary.ts

import type { OperationItem } from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";
import { STATUS_ORDER } from "@shared/types/uiType";

export const INITIAL_SUMMARY: StatusSummary = {
  PROGRESS: 0,
  TOTAL: 0,
  SUCCESS: 0,
  RUNNING: 0,
  SCRIPTRUNNING: 0,
  WAITING: 0,
  SCHEDULED: 0,
  READY: 0,
  ERROR: 0,
};

const VALID_STATUSES = new Set(STATUS_ORDER);

const toEntityMap = (items: OperationItem[]): Record<string, OperationItem> => {
  const entities: Record<string, OperationItem> = {};

  for (const item of items) {
    const kanriNo = String(item.kanriNo);

    if (!kanriNo) {
      continue;
    }

    entities[kanriNo] = {
      ...item,
      kanriNo,
    };
  }

  return entities;
};

export const mapRawEntities = (
  items: OperationItem[],
): Record<string, OperationItem> => toEntityMap(items);

export function calculateSummary(
  entities: Record<string, OperationItem>,
): StatusSummary {
  const items = Object.values(entities);

  const summary: StatusSummary = {
    ...INITIAL_SUMMARY,
    TOTAL: items.length,
  };

  for (const item of items) {
    const status = item.status?.toUpperCase();

    if (status && VALID_STATUSES.has(status as never)) {
      const key = status as keyof StatusSummary;
      summary[key]++;
    }
  }

  summary.PROGRESS =
    summary.TOTAL > 0 ? Math.round((summary.SUCCESS / summary.TOTAL) * 100) : 0;

  return summary;
}
