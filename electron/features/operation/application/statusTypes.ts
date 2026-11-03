// electron/features/operation/application/statusTypes.ts

import type {
  ActiveFlags,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";

export type StatusTarget =
  | (OperationMaster & { targetType: "operation" })
  | (TodayIrregularMaster & { targetType: "today" });

export type ReadyStatusListener = (target: StatusTarget) => void;

export interface ApplyStatusOptions {
  propagate?: boolean;
  flags?: ActiveFlags;
}
