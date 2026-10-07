// electron\features\operation\infrastructure\tracker\trackerHelper.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { isPreviousDayJob } from "@electron/features/operation/domain/operationRules";

import {
  parseHHMM,
  type ParsedTime,
} from "@electron/features/operation/utils/operationUtils";
import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

export { parseHHMM, type ParsedTime };

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
 * OperationMasterからTrackerのJob IDを取得する。
 */
export function getJobId(target: OperationMaster): string | undefined {
  return target.jobId?.trim() || undefined;
}

/**
 * Tracker APIへ問い合わせる開始時刻を生成する。
 *
 * アプリ側のJST時刻をUTCへ変換する。
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
 * Tracker問い合わせ範囲の終了時刻を生成する。
 *
 * kanshiTimeが未指定の場合は1時間後とする。
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
 * Tracker APIのURLを生成する。
 */
export function buildTrackerUrl(
  jobId: string,
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams({
    api_key: TRACKER_API_KEY,
    jobnetwork_name: jobId,
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
 * Tracker APIのレスポンスを
 * アプリ内部のステータスへ変換する。
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
 * Trackerのステータス配列から
 * アプリ内部のステータスを解決する。
 *
 * 配列の最初のステータスのみを参照して評価する。
 */
function resolveStatus(statuses: string[]): JobStatus | undefined {
  const firstStatus = statuses[0];
  if (!firstStatus) {
    return undefined;
  }

  const key = firstStatus
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  return STATUS_ALIAS_MAP[key];
}
