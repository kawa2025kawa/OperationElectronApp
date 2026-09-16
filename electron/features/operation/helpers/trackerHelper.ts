// electron/features/operation/helpers/trackerHelper.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation";

// ============================================================
// 1. 定数 & 型定義
// ============================================================
const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";
const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";
const PREVIOUS_DAY_JOB_PATTERNS = [
  "NMA8510",
  "NMA8101",
  "NMA8300",
  "BENIF7000_",
  "NSI8010",
  "BENMSEXP_",
] as const;

export interface TrackerApiResponseItem {
  status?: string[];
  start_time?: string;
  end_time?: string;
  expected_start_time?: string;
  expected_end_time?: string;
  comment?: string;
  substatus?: string[];
  info?: string;
}

export interface TrackerApiResponse {
  count: number;
  data: TrackerApiResponseItem[];
}

// ============================================================
// 2. バリデーション & 汎用ユーティリティ
// ============================================================
export function validateJobId(target: OperationItem): string {
  if (
    !("jobId" in target) ||
    typeof target.jobId !== "string" ||
    target.jobId.trim().length === 0 ||
    target.jobId === "-"
  ) {
    throw new Error(`Invalid jobId kanriNo=${target.kanriNo}`);
  }
  return target.jobId.trim();
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const formatTrackerDate = (date: Date) =>
  date.toISOString().split(".")[0] + "Z";

function parseHHMM(timeStr?: string | null): [number, number] | null {
  if (!timeStr?.trim()) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return Number.isInteger(h) && Number.isInteger(m) ? [h, m] : null;
}

export const isPreviousDayJob = (jobId: string) =>
  PREVIOUS_DAY_JOB_PATTERNS.some((p) => jobId === p || jobId.startsWith(p));

// ============================================================
// 3. URL生成 & 日付計算ヘルパー
// ============================================================
export function getTargetTime(
  jobId: string,
  scheduledTime?: string | null,
): string {
  const date = new Date();
  const time = parseHHMM(scheduledTime);
  date.setHours(
    time ? time[0] : date.getHours(),
    time ? time[1] : date.getMinutes(),
    0,
    0,
  );
  if (isPreviousDayJob(jobId)) date.setDate(date.getDate() - 1);
  return formatTrackerDate(date);
}

export function addKanshiTime(
  fromStr: string,
  kanshiTime?: string | null,
): string {
  const date = new Date(fromStr);
  const time = parseHHMM(kanshiTime);
  date.setHours(date.getHours() + (time ? time[0] : 1));
  if (time) date.setMinutes(date.getMinutes() + time[1]);
  return formatTrackerDate(date);
}

export const buildTrackerUrl = (jobId: string, from: string, to: string) =>
  `${TRACKER_API_BASE_URL}?api_key=${TRACKER_API_KEY}&jobnetwork_name=${encodeURIComponent(jobId)}&from=${from}&to=${to}`;

export const buildFallbackTrackerUrl = (jobId: string) =>
  `${TRACKER_API_BASE_URL}?api_key=${TRACKER_API_KEY}&jobnetwork_name=${encodeURIComponent(jobId)}`;

// ============================================================
// 4. ステータスマッピング & ノーマライズ
// ============================================================
function normalizeStatus(status?: string[]): JobStatus | undefined {
  if (!status?.length) return undefined;
  const values = status.map((v) => v.toLowerCase());
  if (values.some((v) => ["done", "success", "normal", "end"].includes(v))) {
    return JOB_STATUS.SUCCESS;
  }
  if (values.some((v) => ["error", "failed", "err"].includes(v))) {
    return JOB_STATUS.ERROR;
  }
  if (values.some((v) => ["running", "run", "executing"].includes(v))) {
    return JOB_STATUS.RUNNING;
  }
  return undefined;
}

export function normalizeItem(
  item: TrackerApiResponseItem,
): Partial<OperationItem> {
  return {
    status: normalizeStatus(item.status),
    startTime: item.start_time,
    endTime: item.end_time,
    expectedStartTime: item.expected_start_time,
    expectedEndTime: item.expected_end_time,
    comment: item.comment,
    substatus: item.substatus,
    info: item.info,
  };
}

export function applyTrackerItem(
  tracker: Partial<OperationItem>,
  base: OperationItem,
): OperationItem {
  return {
    ...base,
    status: tracker.status ?? base.status,
    startTime: tracker.startTime ?? base.startTime,
    endTime: tracker.endTime ?? base.endTime,
    expectedStartTime: tracker.expectedStartTime ?? base.expectedStartTime,
    expectedEndTime: tracker.expectedEndTime ?? base.expectedEndTime,
    comment: tracker.comment ?? base.comment,
    substatus: tracker.substatus ?? base.substatus,
    info: tracker.info ?? base.info,
  };
}
