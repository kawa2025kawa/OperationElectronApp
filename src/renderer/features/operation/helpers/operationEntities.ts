import type { OperationItem } from "@shared/types/operation/operationTypes";
import { mapRawEntities } from "./entityUtils";
import { mergeStatus } from "./statusFactory";

export * from "./entityUtils";
export * from "./statusFactory";
export * from "./asyncProcessor";

export function buildInitialOperationData(
  operations: OperationItem[],
  irregulars: OperationItem[],
  statuses: Record<string, OperationItem>,
  todayIrregulars: OperationItem[] = [],
) {
  const operationEntities =
    mapRawEntities(operations);

  const irregularEntities =
    mapRawEntities(irregulars);

  const todayIds = new Set(
    todayIrregulars.map(({ kanriNo }) =>
      String(kanriNo),
    ),
  );

  for (const [
    kanriNo,
    status,
  ] of Object.entries(statuses)) {
    if (operationEntities[kanriNo]) {
      mergeStatus(
        operationEntities[kanriNo],
        status,
      );
    }

    if (
      todayIds.has(kanriNo) &&
      irregularEntities[kanriNo]
    ) {
      mergeStatus(
        irregularEntities[kanriNo],
        status,
      );
    }
  }

  return {
    operationIds: operations.map(
      ({ kanriNo }) =>
        String(kanriNo),
    ),
    operationEntities,

    irregularIds: irregulars.map(
      ({ kanriNo }) =>
        String(kanriNo),
    ),
    irregularEntities,

    todayIds: todayIrregulars.map(
      ({ kanriNo }) =>
        String(kanriNo),
    ),
  };
}
