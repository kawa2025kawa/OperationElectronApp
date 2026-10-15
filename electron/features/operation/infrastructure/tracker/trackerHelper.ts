// electron/features/operation/infrastructure/tracker/trackerHelper.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
  type OperationMaster,
} from "@shared/types/operation/operationTypes";
import { isPreviousDayJob } from "@electron/features/operation/domain/operationRules";
import { parseHHMM } from "@electron/features/operation/utils/operationUtils";

const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";
const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";

const TRACKER_TIMEZONE_OFFSET_HOURS = 9;

const DEFAULT_KANSHI_TIME = {
  hours: 1,
  minutes: 0,
} as const;

const STATUS_ALIAS_MAP: Readonly<Record<string, JobStatus>> = {
  scheduled: JOB_STATUS.SCHEDULED,
  running: JOB_STATUS.RUNNING,
  run: JOB_STATUS.RUNNING,
  scriptrunning: JOB_STATUS.SCRIPT_RUNNING,
  success: JOB_STATUS.SUCCESS,
  done: JOB_STATUS.SUCCESS,
  warning: JOB_STATUS.SUCCESS,
  ready: JOB_STATUS.READY,
  waiting: JOB_STATUS.WAITING,
  wait: JOB_STATUS.WAITING,
  error: JOB_STATUS.ERROR,
  failed: JOB_STATUS.ERROR,
};

export interface TrackerApiResponseItem {
  start_time: string | null;
  end_time: string | null;
  status: string[];
}

export interface TrackerApiResponse {
  data: TrackerApiResponseItem[];
}

/**
 * Tracker API で利用可能な Job ID か判定する。
 * 空文字、空白のみ、"-" は未設定として扱う。
 */
export function isValidTrackerJobId(
  jobId: string | null | undefined,
): jobId is string {
  const normalizedJobId = jobId?.trim();

  return Boolean(normalizedJobId && normalizedJobId !== "-");
}

/**
 * OperationMaster から Tracker の Job ID を取得する。
 */
export function getJobId(target: OperationMaster): string | undefined {
  const jobId = target.jobId?.trim();

  return isValidTrackerJobId(jobId) ? jobId : undefined;
}

/**
 * Tracker API へ問い合わせる開始時刻を生成する。
 * アプリ側の JST 時刻を UTC へ変換する。
 */
export function getTargetTime(
  kanriNo: string,
  scheduledTime?: string | null,
): string {
  const now = new Date();
  const time = parseHHMM(scheduledTime);

  const hours = time?.hours ?? now.getHours();
  const minutes = time?.minutes ?? now.getMinutes();
  const dayOffset = isPreviousDayJob(kanriNo, scheduledTime) ? -1 : 0;

  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayOffset,
      hours - TRACKER_TIMEZONE_OFFSET_HOURS,
      minutes,
    ),
  ).toISOString();
}

/**
 * Tracker 問い合わせ範囲の終了時刻を生成する。
 * kanshiTime が未指定の場合は1時間後とする。
 */
export function addKanshiTime(
  from: string,
  kanshiTime?: string | null,
): string {
  const date = new Date(from);
  const time = parseHHMM(kanshiTime) ?? DEFAULT_KANSHI_TIME;

  date.setUTCHours(
    date.getUTCHours() + time.hours,
    date.getUTCMinutes() + time.minutes,
  );

  return date.toISOString();
}

/**
 * Tracker API の URL を生成する。
 */
export function buildTrackerUrl(
  jobId: string,
  from?: string,
  to?: string,
): string {
  if (!isValidTrackerJobId(jobId)) {
    throw new Error("Tracker API の Job ID が未設定または不正です。");
  }

  const params = new URLSearchParams({
    api_key: TRACKER_API_KEY,
    jobnetwork_name: jobId.trim(),
  });

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  return `${TRACKER_API_BASE_URL}?${params.toString()}`;
}

/**
 * Tracker API のレスポンスをアプリ内部のステータスへ変換する。
 */
export function normalizeItem(
  kanriNo: string,
  item: TrackerApiResponseItem,
): OperationStatusState {
  return {
    kanriNo,
    status: resolveStatus(item.status),
    startTime: item.start_time,
    endTime: item.end_time,
  };
}

/**
 * Tracker のステータス配列からアプリ内部のステータスを解決する。
 *
 * error / failed が含まれる場合は、他のステータスより優先して
 * JOB_STATUS.ERROR として扱う。
 * それ以外の場合は、配列の先頭のステータスを参照する。
 */
function resolveStatus(statuses: string[]): JobStatus | undefined {
  if (statuses.length === 0) {
    return undefined;
  }

  const normalizedStatuses = statuses.map((status) =>
    status
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, ""),
  );

  // エラーが含まれている場合は、エラーを優先する
  if (
    normalizedStatuses.some(
      (status) => STATUS_ALIAS_MAP[status] === JOB_STATUS.ERROR,
    )
  ) {
    return JOB_STATUS.ERROR;
  }

  // エラーがなければ、従来どおり先頭のステータスを使用する
  const firstStatus = normalizedStatuses[0];

  return firstStatus ? STATUS_ALIAS_MAP[firstStatus] : undefined;
}
