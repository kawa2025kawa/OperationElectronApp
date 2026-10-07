// electron/features/operation/domain/statusRules.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

/**
 * 外部（Trackerや手動操作）から上書き保護されるステータスの定義
 */
const PROTECTED_STATUSES = new Set<JobStatus>([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.ERROR,
]);

/**
 * ステータスが保護状態（自動依存関係の再計算などで上書きされない状態）か判定する
 */
export function isProtectedStatus(status?: JobStatus): boolean {
  return status !== undefined && PROTECTED_STATUSES.has(status);
}

/**
 * ステータスが現在実行中（アプリ内スクリプトまたは外部ジョブ）であるか判定する
 */
export function isRunningStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

/**
 * 現在のステータスに新しい更新差分を安全にマージする
 */
export function mergeStatus(
  current: OperationStatusState | undefined,
  update: OperationStatusState,
): OperationStatusState {
  return {
    ...current,
    ...update,
    kanriNo: update.kanriNo,
    status: update.status ?? current?.status,
    comment: update.comment ?? current?.comment ?? "",
  };
}

/**
 * ２つのステータスを比較し、更新（通知や永続化の必要がある変化）があったか判定する
 */
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

/**
 * 初期状態（予定時刻待ち）のステータスオブジェクトを生成する
 */
export function createScheduledStatus(kanriNo: string): OperationStatusState {
  return {
    kanriNo,
    status: JOB_STATUS.SCHEDULED,
    comment: "予定時刻待ち",
    startTime: null,
    endTime: null,
  };
}
