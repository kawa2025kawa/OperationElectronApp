// electron/features/operation/domain/operationRules.ts

import {
  JOB_STATUS,
  WORK_TYPE,
  type JobStatus,
  type OperationStatusState,
  type OperationWorkType,
} from "@shared/types/operation/operationTypes";
import {
  cleanDashCell,
  isRunningStatus,
  normalizeKanriNo,
} from "@shared/utils/sharedUtils";

export { isRunningStatus, normalizeKanriNo };

const PROTECTED_STATUSES: ReadonlySet<JobStatus> = new Set([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
]);

export function isSuccessStatus(status?: JobStatus | null): boolean {
  return status === JOB_STATUS.SUCCESS;
}

export function isProtectedStatus(
  status?: JobStatus | null,
): status is JobStatus {
  return status != null && PROTECTED_STATUSES.has(status);
}

/** 前日日付基準で扱う管理No一覧 */
const PREVIOUS_DAY_SET = new Set<string>(["2", "3", "4", "5", "6", "7"]);

/**
- 自動API問い合わせを行わず手動JCのみ許可し、
- Status の確定はユーザーの手動操作のみで行う Job ID 一覧
 */
const MANUAL_STATUS_DECISION_JOB_IDS = new Set<string>(["ZCM8010"]);

interface ParsedTime {
  hours: number;
  minutes: number;
}

export function parseHHMM(value?: string | null): ParsedTime | null {
  const trimmed = cleanDashCell(value);
  if (!trimmed) return null;

  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null;
}

export const isAutoWorkType = (
  workType?: OperationWorkType | string | null,
): boolean => {
  const trimmed = workType?.trim();
  return trimmed === WORK_TYPE.AUTO || trimmed === WORK_TYPE.IMMEDIATE;
};

export const isPreviousDayJob = (kanriNo: string | number): boolean =>
  PREVIOUS_DAY_SET.has(normalizeKanriNo(kanriNo));

export function isManualStatusDecisionJobId(jobId?: string | null): boolean {
  const normalized = jobId?.trim().toUpperCase();
  return Boolean(normalized && MANUAL_STATUS_DECISION_JOB_IDS.has(normalized));
}

export function isSpecialDependencySatisfied(
  targetKanriNo: string,
  dependencyKanriNo: string,
  dependencyStatus?: OperationStatusState,
): boolean | null {
  const current = dependencyStatus?.status;
  if (!current) return false;

  // 特例: No.75 における No.67 判定（完了または実行中）
  if (
    normalizeKanriNo(targetKanriNo) === "75" &&
    normalizeKanriNo(dependencyKanriNo) === "67"
  ) {
    return isSuccessStatus(current) || isRunningStatus(current);
  }

  return null;
}

export function mergeStatus(
  current: OperationStatusState | undefined,
  update: OperationStatusState,
): OperationStatusState {
  const nextStatus = update.status ?? current?.status;
  const nextErrorSource =
    nextStatus === JOB_STATUS.ERROR
      ? (update.errorSource ?? current?.errorSource ?? null)
      : null;

  return {
    ...current,
    ...update,
    kanriNo: normalizeKanriNo(update.kanriNo),
    status: nextStatus,
    errorSource: nextErrorSource,
    comment: update.comment ?? current?.comment ?? "",
  };
}

const CHANGE_KEYS = [
  "status",
  "errorSource",
  "comment",
  "startTime",
  "endTime",
  "expectedStartTime",
  "expectedEndTime",
  "substatus",
  "info",
] as const;

export function hasStatusChanged(
  prev: OperationStatusState | undefined,
  next: OperationStatusState,
): boolean {
  if (!prev) return true;
  return CHANGE_KEYS.some((k) => prev[k] !== next[k]);
}

export const createScheduledStatus = (
  kanriNo: string,
): OperationStatusState => ({
  kanriNo: normalizeKanriNo(kanriNo),
  status: JOB_STATUS.SCHEDULED,
  errorSource: null,
  comment: "予定時刻待ち",
  startTime: null,
  endTime: null,
});
