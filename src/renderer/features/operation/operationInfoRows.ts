// src/renderer/features/operation/operationInfoRows.ts

import type { ViewMode } from "@renderer/registry/appRegistry";

import type { SelectedOperationItem } from "@shared/types/operation/operationTypes";
import { toDisplayValue } from "./operationDisplayUtils";

export type InfoRowField =
  | "kanriNo"
  | "workName"
  | "scheduleTime"
  | "status"
  | "startTime"
  | "endTime"
  | "comment";

export type InfoRowType = "text" | "status" | "remarks";

export interface InfoRowDefinition {
  field: InfoRowField;
  label: string;
  type: InfoRowType;
}

export interface InfoRowData extends InfoRowDefinition {
  value: string;
}

const INFO_ROW_DEFINITIONS: Record<ViewMode, InfoRowDefinition[]> = {
  operation: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "startTime", label: "開始日時", type: "text" },
    { field: "endTime", label: "終了日時", type: "text" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],

  irregular: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "scheduleTime", label: "開始時刻", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "comment", label: "備考", type: "remarks" },
  ],

  today: [
    { field: "kanriNo", label: "管理番号", type: "text" },
    { field: "workName", label: "作業名", type: "text" },
    { field: "status", label: "ステータス", type: "status" },
    { field: "comment", label: "コメント", type: "remarks" },
  ],
};

function getInfoRowValue(
  field: InfoRowField,
  item: SelectedOperationItem,
  status: string | undefined,
): unknown {
  switch (field) {
    case "kanriNo":
      return item.kanriNo;

    case "workName":
      return item.workName;

    case "status":
      return status;

    case "startTime":
      return item.startTime;

    case "endTime":
      return item.endTime;

    case "comment":
      return item.comment;
  }
}

export function createInfoRows(
  mode: ViewMode,
  item: SelectedOperationItem | undefined,
  status: string | undefined,
): InfoRowData[] {
  return INFO_ROW_DEFINITIONS[mode].map((definition) => ({
    ...definition,
    value: item
      ? toDisplayValue(getInfoRowValue(definition.field, item, status))
      : "",
  }));
}
