// electron/features/operation/application/statusTypes.ts

import type {
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";

export type StatusTarget =
  | (OperationMaster & {
      targetType: "operation";
    })
  | (TodayIrregularMaster & {
      targetType: "today";
    });

export type ReadyStatusListener = (target: StatusTarget) => void;
