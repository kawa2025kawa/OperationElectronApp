// electron/services/operation/tracker.ts

import type { JobStatus, OperationItem } from "@shared/types/operationType";

// ============================================================
// Types
// ============================================================

interface TrackerApiResponseItem {
  status?: string[];
  start_time?: string;
  end_time?: string;
  expected_start_time?: string;
  expected_end_time?: string;
  comment?: string;
  substatus?: string[];
  info?: string;
}

interface TrackerApiResponse {
  count: number;
  data: TrackerApiResponseItem[];
}

// ============================================================
// Constants
// ============================================================

const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";

const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";

const MAX_RETRIES = 3;

const RETRY_DELAYS_MS = [2_000, 4_000];

const DEFAULT_KANSHI_TIME_HOURS = 1;

/**
 * scheduleTimeを常に前日として扱うJOB。
 *
 * 完全一致と前方一致を分けず、
 * 1つの配列で判定する。
 */
const PREVIOUS_DAY_JOB_PATTERNS = [
  "NMA8510",
  "NMA8101",
  "NMA8300",
  "BENIF7000_",
  "NSI8010",
  "BENMSEXP_",
];

// ============================================================
// Public
// ============================================================

/**
 * Job IDからTracker状態を取得する。
 *
 * data=[] は正常な空結果として扱う。
 * HTTPエラー・通信エラーのみリトライする。
 */
export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<Partial<OperationItem>[]> {
  const jobId = validateJobId(target);

  const from = getTargetTime(jobId, target.scheduledTime);
  const to = addKanshiTime(from, target.kanshiTime);

  console.log("[Tracker Target]", {
    kanriNo: target.kanriNo,
    jobId,
    from,
    to,
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await requestTracker(jobId, from, to);

      if (result.length === 0) {
        console.debug("[Tracker] empty response", {
          kanriNo: target.kanriNo,
          jobId,
        });

        return [];
      }

      return result;
    } catch (error) {
      console.error(
        `[Tracker] request failed attempt=${attempt}/${MAX_RETRIES}`,
        {
          kanriNo: target.kanriNo,
          jobId,
          error,
        },
      );

      if (attempt === MAX_RETRIES) {
        return [];
      }

      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
  }

  return [];
}

// ============================================================
// HTTP
// ============================================================

async function requestTracker(
  jobId: string,
  from: string,
  to: string,
): Promise<Partial<OperationItem>[]> {
  const url = buildTrackerUrl(jobId, from, to);

  console.debug("[Tracker Request]", {
    jobId,
    from,
    to,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Tracker API Error ${response.status}`);
  }

  const json = (await response.json()) as TrackerApiResponse;

  if (jobId === "NUR8010") {
    console.log("[Tracker Response][NUR8010]");
    console.dir(json, { depth: null });
  }

  return (json.data ?? []).map(normalizeItem);
}

function buildTrackerUrl(jobId: string, from: string, to: string): string {
  const params = new URLSearchParams({
    api_key: TRACKER_API_KEY,
    jobnetwork_name: jobId,
    from,
    to,
  });

  return `${TRACKER_API_BASE_URL}?${params.toString()}`;
}

// ============================================================
// Mapping
// ============================================================

/**
 * Trackerの結果をOperationItemへ反映する。
 */
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

function normalizeItem(item: TrackerApiResponseItem): Partial<OperationItem> {
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

/**
 * Tracker APIのStatusをアプリ側Statusへ変換する。
 */
function normalizeStatus(status?: string[]): JobStatus | undefined {
  if (!status?.length) {
    return undefined;
  }

  const values = status.map((value) => value.toLowerCase());

  // done系を最優先
  if (
    values.includes("done") ||
    values.includes("success") ||
    values.includes("normal") ||
    values.includes("end")
  ) {
    return "success";
  }

  // エラー
  if (
    values.includes("error") ||
    values.includes("failed") ||
    values.includes("err")
  ) {
    return "error";
  }

  // 実行中
  if (
    values.includes("running") ||
    values.includes("run") ||
    values.includes("executing")
  ) {
    return "running";
  }

  // 待機
  if (values.includes("wait") || values.includes("waiting")) {
    return "waiting";
  }

  // 準備完了
  if (values.includes("ready")) {
    return "ready";
  }

  return undefined;
}

// ============================================================
// Time
// ============================================================

function getTargetTime(jobId: string, scheduledTime?: string | null): string {
  const date = createScheduledDate(scheduledTime);

  if (isPreviousDayJob(jobId)) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString();
}

function createScheduledDate(scheduledTime?: string | null): Date {
  const now = new Date();

  if (!scheduledTime) {
    return now;
  }

  const [hour, minute] = scheduledTime.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return now;
  }

  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  return date;
}

function isPreviousDayJob(jobId: string): boolean {
  return PREVIOUS_DAY_JOB_PATTERNS.some(
    (pattern) => jobId === pattern || jobId.startsWith(pattern),
  );
}

function addKanshiTime(from: string, kanshiTime?: string | null): string {
  const date = new Date(from);

  if (!kanshiTime) {
    date.setHours(date.getHours() + DEFAULT_KANSHI_TIME_HOURS);

    return date.toISOString();
  }

  const [hour, minute] = kanshiTime.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    date.setHours(date.getHours() + DEFAULT_KANSHI_TIME_HOURS);

    return date.toISOString();
  }

  date.setHours(date.getHours() + hour);
  date.setMinutes(date.getMinutes() + minute);

  return date.toISOString();
}

// ============================================================
// Validation
// ============================================================

function validateJobId(target: OperationItem): string {
  const jobId = target.jobId;

  if (typeof jobId !== "string" || jobId.trim().length === 0 || jobId === "-") {
    throw new Error(`Invalid jobId kanriNo=${target.kanriNo}`);
  }

  return jobId;
}

// ============================================================
// Utility
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
