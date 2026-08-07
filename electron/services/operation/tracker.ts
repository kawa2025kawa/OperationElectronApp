import type { JobStatus, OperationItem } from "@shared/types/operationType";

/**
 * Tracker API 生レスポンス
 */
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

/**
 * Tracker API 正規化後
 *
 * アプリ内部で利用する形式
 */
export interface TrackerApiItem {
  status?: JobStatus;

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

const DEFAULT_TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";

const DEFAULT_TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";

const MAX_RETRIES = 3;

/**
 * Tracker API取得
 *
 * Tauri:
 * fetch_tracker_by_job_id()
 *
 * Electron:
 * OperationItem → Tracker API
 */
export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<TrackerApiItem[]> {
  if (!target.jobId || target.jobId === "-") {
    throw new Error(`Invalid jobId kanriNo=${target.kanriNo}`);
  }

  const from = getTargetTime(target.jobId, target.scheduledTime);

  const to = addKanshiTime(from, target.kanshiTime);

  console.log("[Tracker Target]", {
    kanriNo: target.kanriNo,
    jobId: target.jobId,
    from,
    to,
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await requestTracker(target.jobId, from, to);

      if (result.length > 0) {
        return result;
      }

      console.warn(`[Tracker] data empty attempt=${attempt}/${MAX_RETRIES}`);
    } catch (error) {
      console.error(
        `[Tracker] request failed attempt=${attempt}/${MAX_RETRIES}`,
        error,
      );
    }

    if (attempt < MAX_RETRIES) {
      await sleep(2000 * attempt);
    }
  }

  return [];
}

/**
 * HTTP問い合わせ
 */
async function requestTracker(
  jobId: string,
  from: string,
  to: string,
): Promise<TrackerApiItem[]> {
  const params = new URLSearchParams({
    api_key: DEFAULT_TRACKER_API_KEY,

    jobnetwork_name: jobId,

    from,

    to,
  });

  const url = `${DEFAULT_TRACKER_API_BASE_URL}?${params.toString()}`;

  console.log("[Tracker Request]", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Tracker API Error ${response.status}`);
  }

  const text = await response.text();

  console.log("[Tracker Response]", text);

  const json = JSON.parse(text) as TrackerApiResponse;

  return (json.data ?? []).map(normalizeItem);
}

/**
 * Tracker → OperationItem反映
 */
export function applyTrackerItem(
  tracker: TrackerApiItem,
  base: OperationItem,
): OperationItem {
  return {
    ...base,

    status: tracker.status ?? base.status,

    startTime: tracker.start_time ?? base.startTime,

    endTime: tracker.end_time ?? base.endTime,

    expectedStartTime: tracker.expected_start_time ?? base.expectedStartTime,

    expectedEndTime: tracker.expected_end_time ?? base.expectedEndTime,

    comment: tracker.comment ?? base.comment,

    substatus: tracker.substatus ?? base.substatus,

    info: tracker.info ?? base.info,
  };
}

/**
 * Tracker 時刻生成
 *
 * Tauri:
 * get_target_time()
 */
function getTargetTime(jobId: string, scheduledTime?: string | null): string {
  const now = new Date();

  if (!scheduledTime) {
    return now.toISOString();
  }

  const [hour, minute] = scheduledTime.split(":").map(Number);

  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  const previousDayJobs = [
    "NMA8510",
    "NMA8101",
    "NMA8300",
    "BENIF7000_",
    "NSI8010",
    "BENMSEXP_",
  ];

  if (previousDayJobs.includes(jobId) && date > now) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString();
}

/**
 * 監視時間加算
 */
function addKanshiTime(from: string, kanshiTime?: string | null): string {
  const date = new Date(from);

  if (!kanshiTime) {
    date.setHours(date.getHours() + 1);

    return date.toISOString();
  }

  const [hour, minute] = kanshiTime.split(":").map(Number);

  date.setHours(date.getHours() + hour);

  date.setMinutes(date.getMinutes() + minute);

  return date.toISOString();
}

/**
 * API形式 → 内部形式変換
 */
function normalizeItem(item: TrackerApiResponseItem): TrackerApiItem {
  return {
    ...item,

    status: normalizeStatus(item.status),
  };
}

/**
 * Tracker status変換
 */
function normalizeStatus(status?: string[]): JobStatus | undefined {
  if (!status || status.length === 0) {
    return undefined;
  }

  const value = status[status.length - 1].toLowerCase();

  switch (value) {
    case "running":
    case "run":
    case "executing":
      return "running";

    case "waiting":
      return "waiting";

    case "ready":
      return "ready";

    case "done":
    case "success":
    case "normal":
    case "end":
      return "success";

    case "error":
    case "failed":
    case "err":
      return "error";

    default:
      return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
