// src/renderer/features/operation/utils/operationDisplayUtils.ts

import { EMPTY_VALUE_FALLBACK } from "@shared/utils/sharedUtils";
import {
  JOB_STATUS_VALUES,
  OPERATION_FIELD_LABELS,
  type JobStatus,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  formatJapanDateTime,
  tryFormatIsoDateTime,
} from "@shared/utils/sharedUtils";

type InfoRowField =
  | "kanriNo"
  | "workType"
  | "workName"
  | "scheduleTime"
  | "status"
  | "startTime"
  | "endTime"
  | "comment"
  | "cycle";

type InfoRowType = "text" | "status" | "remarks";

interface InfoRowDefinition {
  readonly field: InfoRowField;
  readonly label: string;
  readonly type: InfoRowType;
}

export interface InfoRowData extends InfoRowDefinition {
  readonly value: string;
}

const JOB_STATUS_SET = new Set<string>(JOB_STATUS_VALUES);

const OPERATION_INFO_ROW_DEFINITIONS = {
  operation: [
    { field: "kanriNo", label: OPERATION_FIELD_LABELS.kanriNo, type: "text" },
    { field: "workType", label: OPERATION_FIELD_LABELS.workType, type: "text" },
    { field: "workName", label: OPERATION_FIELD_LABELS.workName, type: "text" },
    { field: "status", label: OPERATION_FIELD_LABELS.status, type: "status" },
    {
      field: "startTime",
      label: OPERATION_FIELD_LABELS.startTime,
      type: "text",
    },
    { field: "endTime", label: OPERATION_FIELD_LABELS.endTime, type: "text" },
    {
      field: "comment",
      label: OPERATION_FIELD_LABELS.comment,
      type: "remarks",
    },
  ],
  irregular: [
    { field: "kanriNo", label: OPERATION_FIELD_LABELS.kanriNo, type: "text" },
    {
      field: "scheduleTime",
      label: OPERATION_FIELD_LABELS.scheduledTime,
      type: "text",
    },
    { field: "workName", label: OPERATION_FIELD_LABELS.workName, type: "text" },
    { field: "cycle", label: OPERATION_FIELD_LABELS.cycle, type: "text" },
  ],
  today: [
    { field: "kanriNo", label: OPERATION_FIELD_LABELS.kanriNo, type: "text" },
    { field: "workType", label: OPERATION_FIELD_LABELS.workType, type: "text" },
    { field: "workName", label: OPERATION_FIELD_LABELS.workName, type: "text" },
    { field: "status", label: OPERATION_FIELD_LABELS.status, type: "status" },
    {
      field: "comment",
      label: OPERATION_FIELD_LABELS.comment,
      type: "remarks",
    },
  ],
} as const satisfies Record<ViewMode, readonly InfoRowDefinition[]>;

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && JOB_STATUS_SET.has(value);
}

export function getOperationWorkName(
  workName: unknown,
  kanriNo: string,
): string {
  return typeof workName === "string" && workName ? workName : `No.${kanriNo}`;
}

export function toDisplayValue(value: unknown): string {
  if (value == null || value === "") {
    return EMPTY_VALUE_FALLBACK;
  }

  if (value instanceof Date) {
    return formatJapanDateTime(value);
  }

  if (typeof value === "string") {
    return tryFormatIsoDateTime(value);
  }

  return String(value);
}

export function createInfoRows(
  mode: ViewMode,
  item: OperationViewItem | undefined,
  status: JobStatus | undefined,
): InfoRowData[] {
  return OPERATION_INFO_ROW_DEFINITIONS[mode].map((definition) => {
    if (!item) {
      return { ...definition, value: "" };
    }

    if (definition.field === "status" && status !== undefined) {
      return { ...definition, value: toDisplayValue(status) };
    }

    const key =
      definition.field === "scheduleTime" ? "scheduledTime" : definition.field;

    if (!Object.hasOwn(item, key)) {
      return { ...definition, value: EMPTY_VALUE_FALLBACK };
    }

    const rawValue = (item as unknown as Record<string, unknown>)[key];
    const displayValue =
      definition.field === "workName"
        ? getOperationWorkName(rawValue, item.kanriNo)
        : toDisplayValue(rawValue);

    return { ...definition, value: displayValue };
  });
}
