// src/renderer/features/operation/operationDisplayUtils.ts

import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { OPERATION_FIELD_LABELS } from "@shared/types/operation/operationTypes";
import { EMPTY_VALUE_FALLBACK } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const JAPAN_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

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
  readonly value: string; // string型
}

export interface InfoRowValue {
  readonly exists: boolean;
  readonly value: unknown;
}

export const OPERATION_INFO_ROW_DEFINITIONS = {
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

// 作業名が未設定の場合の代替表示値を返す。
export function getOperationWorkName(
  workName: unknown,
  kanriNo: string,
): string {
  return typeof workName === "string" && workName ? workName : `No.${kanriNo}`;
}

// 日本時間の YYYY/MM/DD HH:mm:ss 形式に整形する。
function formatJapanDateTime(date: Date): string {
  return JAPAN_DATE_FORMATTER.format(date);
}

// 有効な日付オブジェクトかを判定する。
function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

// プロパティが存在しない場合の欠損プレースホルダー表示値を返す。
export function toMissingPropertyDisplayValue(): string {
  return EMPTY_VALUE_FALLBACK;
}

// 存在するプロパティの値を表示用文字列に変換する。
export function toDisplayValue(value: unknown): string {
  if (value == null || value === "") {
    return EMPTY_VALUE_FALLBACK;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? formatJapanDateTime(value) : String(value);
  }

  if (typeof value === "string" && ISO_DATE_TIME_PATTERN.test(value)) {
    const date = new Date(value);
    return isValidDate(date) ? formatJapanDateTime(date) : value;
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
