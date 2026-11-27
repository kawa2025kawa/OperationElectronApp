// src/renderer/features/operation/utils/operationDisplayUtils.ts

import {
  EMPTY_VALUE_FALLBACK,
  formatJapanDateTime,
  tryFormatIsoDateTime,
} from "@renderer/utils/rendererUtils";
import {
  JOB_STATUS,
  JOB_STATUS_VALUES,
  type JobStatus,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

export const OPERATION_FIELD_LABELS = {
  kanriNo: "管理No",
  workName: "業務名",
  workType: "区分",
  scheduledTime: "予定時刻",
  jobId: "ジョブID",
  status: "状態",
  cycle: "サイクル",
  startTime: "開始時刻",
  endTime: "終了時刻",
  comment: "備考",
} as const;

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

/** 内部ステータス（scriptRunning / waiting）を表示用の代表ステータスへ正規化する */
export function normalizeDisplayStatus(status: JobStatus): JobStatus;
export function normalizeDisplayStatus(
  status?: JobStatus,
): JobStatus | undefined;
export function normalizeDisplayStatus(
  status?: JobStatus,
): JobStatus | undefined {
  if (status === JOB_STATUS.SCRIPT_RUNNING) return JOB_STATUS.RUNNING;
  if (status === JOB_STATUS.WAITING) return JOB_STATUS.SCHEDULED;
  return status;
}

/** サマリーステータスフィルタと行のステータスが一致するか判定する */
export function matchesSummaryStatusFilter(
  rowStatus: JobStatus | undefined,
  filterValue: unknown,
): boolean {
  if (!isJobStatus(filterValue)) {
    return rowStatus === filterValue;
  }
  return rowStatus !== undefined && normalizeDisplayStatus(rowStatus) === filterValue;
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
