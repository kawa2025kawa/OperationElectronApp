// electron/features/operation/domain/operationRules.ts

import {
  JOB_STATUS,
  WORK_TYPE,
  type CenterId,
  type OperationStatusState,
  type OperationWorkType,
} from "@shared/types/operation/operationTypes";
import {
  isProtectedStatus,
  isRunningStatus,
  isSuccessStatus,
  normalizeKanriNo,
} from "@shared/utils/statusUtils";

export { isProtectedStatus, isRunningStatus, normalizeKanriNo };

const CENTER_FLAG_KEYS: readonly CenterId[] = ["1C", "2C", "3C"] as const;
const CENTER_FLAGS = new Set<string>(CENTER_FLAG_KEYS);

/** 前日日付基準で扱う管理No一覧 */
const PREVIOUS_DAY_KANRI_NO_LIST = ["2", "3", "4", "5", "6", "7"] as const;
const PREVIOUS_DAY_SET = new Set<string>(PREVIOUS_DAY_KANRI_NO_LIST);

/**
- 自動API問い合わせを行わず手動JCのみ許可し、
- Status の確定はユーザーの手動操作のみで行う Job ID 一覧
 */
const MANUAL_STATUS_DECISION_JOB_IDS = new Set<string>(["ZCM8010"]);

export interface ParsedTime {
  hours: number;
  minutes: number;
}

/**
- scheduledTime（"hh:mm" もしくは "-"）から時刻を抽出する。
- "-" や不正フォーマットの場合は null を返す。
 */
export function parseHHMM(value?: string | null): ParsedTime | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "-") return null;

  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null;
}

export const isAutoWorkType = (workType?: OperationWorkType | string | null): boolean =>
  workType?.trim() === WORK_TYPE.AUTO;

export const isManualWorkType = (workType?: OperationWorkType | string | null): boolean =>
  workType?.trim() === WORK_TYPE.MANUAL;

export const isPreviousDayJob = (kanriNo: string | number): boolean =>
  PREVIOUS_DAY_SET.has(normalizeKanriNo(kanriNo));

export const hasCenterFlagDependency = (deps: readonly string[]): boolean =>
  deps.some((dep) => CENTER_FLAGS.has(dep));

/** 手動JCで時刻のみ取得し、Status自体はユーザーの手動確定とする対象か */
export function isManualStatusDecisionJobId(jobId?: string | null): boolean {
  const normalized = jobId?.trim().toUpperCase();
  return Boolean(normalized && MANUAL_STATUS_DECISION_JOB_IDS.has(normalized));
}

/** 個別管理No間の特例依存判定（デフォルトは完了済みのみ充足） */
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
  return {
    ...current,
    ...update,
    kanriNo: normalizeKanriNo(update.kanriNo),
    status: update.status ?? current?.status,
    comment: update.comment ?? current?.comment ?? "",
  };
}

const CHANGE_KEYS = [
  "status",
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
  comment: "予定時刻待ち",
  startTime: null,
  endTime: null,
});