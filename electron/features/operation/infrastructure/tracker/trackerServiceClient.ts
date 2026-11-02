// electron/features/operation/infrastructure/tracker/trackerServiceClient.ts

import {
  isPreviousDayJob,
  parseHHMM,
} from "@electron/features/operation/domain/operationRules";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationMaster,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

export type { ParsedTime } from "@electron/features/operation/domain/operationRules";

const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";
const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";
const TRACKER_TIMEZONE_OFFSET_HOURS = 9;
const FETCH_TIMEOUT_MS = 30_000;

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

let requestSequence = 0;

// Tracker API で利用可能な有効な Job ID かを判定する。
export function isValidTrackerJobId(
  jobId: string | null | undefined,
): jobId is string {
  const normalizedJobId = jobId?.trim();
  return Boolean(normalizedJobId && normalizedJobId !== "-");
}

// 運用マスターから有効な Tracker Job ID を取得する。
export function getJobId(target: OperationMaster): string | undefined {
  const jobId = target.jobId?.trim();
  return isValidTrackerJobId(jobId) ? jobId : undefined;
}

// Tracker API へ問い合わせる基準開始時刻（UTC）を生成する。
function getTargetTime(kanriNo: string, scheduledTime?: string | null): string {
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

// 監視時間（デフォルト1時間）を加算した終了時刻（UTC）を生成する。
function addKanshiTime(from: string, kanshiTime?: string | null): string {
  const date = new Date(from);
  const time = parseHHMM(kanshiTime) ?? DEFAULT_KANSHI_TIME;

  date.setUTCHours(
    date.getUTCHours() + time.hours,
    date.getUTCMinutes() + time.minutes,
  );

  return date.toISOString();
}

// Tracker API のリクエストURLを構築する。
function buildTrackerUrl(jobId: string, from?: string, to?: string): string {
  if (!isValidTrackerJobId(jobId)) {
    throw new Error("Tracker API の Job ID が未設定または不正です。");
  }

  const params = new URLSearchParams({
    api_key: TRACKER_API_KEY,
    jobnetwork_name: jobId.trim(),
  });

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return `${TRACKER_API_BASE_URL}?${params.toString()}`;
}

// ログ出力用にURL内のAPIキーをマスクする。
function getSafeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.searchParams.has("api_key")) {
      parsedUrl.searchParams.set("api_key", "********");
    }
    return parsedUrl.toString();
  } catch {
    return url.replace(/([?&]api_key=)[^&]*/i, "$1********");
  }
}

// Tracker のステータス文字列配列からアプリ内部のステータスを解決する。
function resolveStatus(statuses: string[]): JobStatus | undefined {
  if (statuses.length === 0) return undefined;

  const normalizedStatuses = statuses.map((status) =>
    status
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, ""),
  );

  if (
    normalizedStatuses.some(
      (status) => STATUS_ALIAS_MAP[status] === JOB_STATUS.ERROR,
    )
  ) {
    return JOB_STATUS.ERROR;
  }

  const firstStatus = normalizedStatuses[0];
  return firstStatus ? STATUS_ALIAS_MAP[firstStatus] : undefined;
}

// Tracker API の生データをアプリ内ステータス状態に正規化する。
function normalizeItem(
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

// Tracker API に HTTP GET リクエストを送信し、データ配列を取得する。
async function fetchTrackerData(
  url: string,
): Promise<TrackerApiResponseItem[]> {
  const requestId = ++requestSequence;
  const timestamp = new Date().toISOString();
  const safeUrl = getSafeUrl(url);

  console.log(
    `[${timestamp}] [TrackerServiceClient] Request #${requestId} START`,
    { method: "GET", url: safeUrl, timeoutMs: FETCH_TIMEOUT_MS },
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      console.error(
        `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} HTTP ERROR`,
        {
          url: safeUrl,
          status: response.status,
          statusText: response.statusText,
          elapsedMs,
        },
      );
      return [];
    }

    const data = (await response.json()) as TrackerApiResponse;
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} ERROR`,
      { url: safeUrl, error },
    );
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// 日時範囲指定（失敗時は全体検索）でTrackerから対象ジョブの実行情報を検索する。
async function findTrackerItem(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<TrackerApiResponseItem | undefined> {
  const from = getTargetTime(kanriNo, scheduledTime);
  const to = addKanshiTime(from);
  const rangeUrl = buildTrackerUrl(jobId, from, to);

  const rangeItems = await fetchTrackerData(rangeUrl);
  if (rangeItems.length > 0) {
    return rangeItems[0];
  }

  const fallbackUrl = buildTrackerUrl(jobId);
  const fallbackItems = await fetchTrackerData(fallbackUrl);
  return fallbackItems[0];
}

// Job ID を指定して Tracker から最新ステータスを取得する。
export async function fetchTrackerStatusByJobId(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<OperationStatusState | undefined> {
  const item = await findTrackerItem(jobId, scheduledTime, kanriNo);
  if (!item) return undefined;

  return normalizeItem(kanriNo, item);
}
