// electron/features/operation/domain/operationRules.ts

import {
  JOB_STATUS,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  isProtectedStatus,
  isRunningStatus,
  isSuccessStatus,
  normalizeKanriNo,
} from "@shared/utils/statusUtils";

export {
  isProtectedStatus,
  isRunningStatus,
  isSuccessStatus,
  normalizeKanriNo,
};

const CENTER_FLAGS: ReadonlySet<string> = new Set(["1C", "2C", "3C"]);

const PREVIOUS_DAY_KANRI_NOS: ReadonlySet<string> = new Set([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);

export interface ParsedTime {
  hours: number;
  minutes: number;
}

// HH:mm形式の時刻を解析する。
export function parseHHMM(value?: string | null): ParsedTime | null {
  const match = value?.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

// 前日日付として処理すべきジョブかを判定する。
export function isPreviousDayJob(
  kanriNo: string | number,
  scheduledTime?: string | null,
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);
  return (
    PREVIOUS_DAY_KANRI_NOS.has(normalizedKanriNo) ||
    Boolean(scheduledTime?.includes("前日"))
  );
}

// 依存関係一覧にセンターフラグ（1C/2C/3C）が含まれるか判定する。
export function hasCenterFlagDependency(
  dependencies: readonly string[],
): boolean {
  return dependencies.some((dep) => CENTER_FLAGS.has(dep));
}

// 現在のステータスに新しい更新差分を安全にマージする。
export function mergeStatus(
  current: OperationStatusState | undefined,
  update: OperationStatusState,
): OperationStatusState {
  const kanriNo = normalizeKanriNo(update.kanriNo);

  return {
    ...current,
    ...update,
    kanriNo,
    status: update.status ?? current?.status,
    comment: update.comment ?? current?.comment ?? "",
  };
}

// 2つのステータスを比較し、永続化や通知が必要な変化があったか判定する。
export function hasStatusChanged(
  previous: OperationStatusState | undefined,
  next: OperationStatusState,
): boolean {
  if (!previous) return true;

  return (
    previous.status !== next.status ||
    previous.comment !== next.comment ||
    previous.startTime !== next.startTime ||
    previous.endTime !== next.endTime ||
    previous.expectedStartTime !== next.expectedStartTime ||
    previous.expectedEndTime !== next.expectedEndTime ||
    previous.substatus !== next.substatus ||
    previous.info !== next.info
  );
}

// 初期状態（予定時刻待ち）のステータスオブジェクトを生成する。
export function createScheduledStatus(kanriNo: string): OperationStatusState {
  return {
    kanriNo: normalizeKanriNo(kanriNo),
    status: JOB_STATUS.SCHEDULED,
    comment: "予定時刻待ち",
    startTime: null,
    endTime: null,
  };
}
