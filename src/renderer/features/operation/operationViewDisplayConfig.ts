import type { JobStatus } from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

export type InfoRowField =
  | "kanriNo"
  | "workName"
  | "scheduleTime"
  | "status"
  | "startTime"
  | "endTime"
  | "comment"
  | "cycle";

export type InfoRowType = "text" | "status" | "remarks";

export interface InfoRowDefinition {
  readonly field: InfoRowField;
  readonly label: string;
  readonly type: InfoRowType;
}

export interface InfoRowData extends InfoRowDefinition {
  readonly value: string;
}

export interface InfoRowValue {
  readonly exists: boolean;
  readonly value: unknown;
}

export const OPERATION_INFO_ROW_DEFINITIONS = {
  operation: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "status", label: "状態", type: "status" },
    { field: "startTime", label: "開始時刻", type: "text" },
    { field: "endTime", label: "終了時刻", type: "text" },
    { field: "comment", label: "備考", type: "remarks" },
  ],
  irregular: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "scheduleTime", label: "予定時刻", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "cycle", label: "サイクル", type: "text" },
  ],
  today: [
    { field: "kanriNo", label: "管理No", type: "text" },
    { field: "workName", label: "業務名", type: "text" },
    { field: "status", label: "状態", type: "status" },
    { field: "comment", label: "備考", type: "remarks" },
  ],
} as const satisfies Record<ViewMode, readonly InfoRowDefinition[]>;

export type { JobStatus };
