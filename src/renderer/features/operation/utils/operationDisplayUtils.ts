// src/renderer/features/operation/utils/operationDisplayUtils.ts

import {
  JOB_STATUS_VALUES,
  type JobStatus,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { OPERATION_FIELD_LABELS } from "@shared/types/operation/operationTypes";
import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  formatJapanDateTime,
  tryFormatIsoDateTime,
} from "@shared/utils/dateTimeUtils";

type InfoRowField =
  | "kanriNo"
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

interface InfoRowValue {
  readonly exists: boolean;
  readonly value: unknown;
}

const OPERATION_INFO_ROW_DEFINITIONS = {
  operation: [
    { field: "kanriNo", label: OPERATION_FIELD_LABELS.kanriNo, type: "text" },
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
  return (
    typeof value === "string" &&
    (JOB_STATUS_VALUES as readonly string[]).includes(value)
  );
}

// 作業名が未設定の場合の代替表示値を返す。
export function getOperationWorkName(
  workName: unknown,
  kanriNo: string,
): string {
  return typeof workName === "string" && workName ? workName : `No.${kanriNo}`;
}

// プロパティが存在しない場合の欠落プレースホルダー表示値を返す。
export function toMissingPropertyDisplayValue(): string {
  return EMPTY_VALUE_FALLBACK;
}

// 存在するプロパティの値を表示用文字列に変換する。
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

// アイテムオブジェクトから指定キーのプロパティ値を取り出す。
function getOwnPropertyValue(
  item: OperationViewItem,
  key: string,
): InfoRowValue {
  if (!Object.prototype.hasOwnProperty.call(item, key)) {
    return { exists: false, value: undefined };
  }

  return {
    exists: true,
    value: (item as unknown as Record<string, unknown>)[key],
  };
}

// フィールド定義に応じた値を取得する。
function getInfoRowValue(
  field: InfoRowField,
  item: OperationViewItem,
  status: JobStatus | undefined,
): InfoRowValue {
  if (field === "status" && status !== undefined) {
    return { exists: true, value: status };
  }

  const key = field === "scheduleTime" ? "scheduledTime" : field;
  return getOwnPropertyValue(item, key);
}

// 表示モードと対象アイテムに応じた詳細情報ペインの各行データを生成する。
export function createInfoRows(
  mode: ViewMode,
  item: OperationViewItem | undefined,
  status: JobStatus | undefined,
): InfoRowData[] {
  return OPERATION_INFO_ROW_DEFINITIONS[mode].map((definition) => {
    if (!item) {
      return { ...definition, value: "" };
    }

    const fieldValue = getInfoRowValue(definition.field, item, status);

    if (!fieldValue.exists) {
      return {
        ...definition,
        value: toMissingPropertyDisplayValue(),
      };
    }

    const displayValue =
      definition.field === "workName"
        ? getOperationWorkName(fieldValue.value, item.kanriNo)
        : toDisplayValue(fieldValue.value);

    return {
      ...definition,
      value: displayValue,
    };
  });
}