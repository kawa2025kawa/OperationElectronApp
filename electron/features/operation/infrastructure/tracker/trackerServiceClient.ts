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

export interface TrackerApiResponseItem {
  start_time: string | null;
  end_time: string | null;
  status: string[];
}

export interface TrackerApiResponse {
  data: TrackerApiResponseItem[];
}

export const TRACKER_CONFIG = {
  apiKey: "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91",
  apiBaseUrl: "http://192.88.1.152/api/v2/trackers",
  timezoneOffsetHours: 9,
  fetchTimeoutMs: 30_000,
  defaultKanshiTime: { hours: 1, minutes: 0 },
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

let requestSequence = 0;

export function isValidTrackerJobId(
  jobId: string | null | undefined,
): jobId is string {
  const norm = jobId?.trim();
  return Boolean(norm && norm !== "-");
}

export function getJobId(target: OperationMaster): string | undefined {
  const jobId = target.jobId?.trim();
  return isValidTrackerJobId(jobId) ? jobId : undefined;
}

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
      hours - TRACKER_CONFIG.timezoneOffsetHours,
      minutes,
    ),
  ).toISOString();
}

function addKanshiTime(from: string, kanshiTime?: string | null): string {
  const date = new Date(from);
  const time = parseHHMM(kanshiTime) ?? TRACKER_CONFIG.defaultKanshiTime;
  date.setUTCHours(
    date.getUTCHours() + time.hours,
    date.getUTCMinutes() + time.minutes,
  );
  return date.toISOString();
}

function buildTrackerUrl(jobId: string, from?: string, to?: string): string {
  if (!isValidTrackerJobId(jobId))
    throw new Error("Tracker API の Job ID が未設定または不正です。");
  const params = new URLSearchParams({
    api_key: TRACKER_CONFIG.apiKey,
    jobnetwork_name: jobId.trim(),
  });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `${TRACKER_CONFIG.apiBaseUrl}?${params.toString()}`;
}

function resolveStatus(statuses: string[]): JobStatus | undefined {
  if (statuses.length === 0) return undefined;
  const list = statuses.map((s) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, ""),
  );
  if (list.some((s) => STATUS_ALIAS_MAP[s] === JOB_STATUS.ERROR))
    return JOB_STATUS.ERROR;
  return STATUS_ALIAS_MAP[list[0]];
}

async function fetchTrackerData(
  url: string,
): Promise<TrackerApiResponseItem[]> {
  const reqId = ++requestSequence;
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] [TrackerClient] #${reqId} START`, {
    url,
  });

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    TRACKER_CONFIG.fetchTimeoutMs,
  );

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error(
        `[${new Date().toISOString()}] [TrackerClient] #${reqId} HTTP ${res.status}`,
        { url, ms: Date.now() - start },
      );
      return [];
    }
    const data = (await res.json()) as TrackerApiResponse;
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [TrackerClient] #${reqId} ERROR`,
      { url, error },
    );
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function findTrackerItem(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<TrackerApiResponseItem | undefined> {
  const from = getTargetTime(kanriNo, scheduledTime);
  const rangeItems = await fetchTrackerData(
    buildTrackerUrl(jobId, from, addKanshiTime(from)),
  );
  if (rangeItems.length > 0) return rangeItems[0];

  const fallbackItems = await fetchTrackerData(buildTrackerUrl(jobId));
  return fallbackItems[0];
}

export async function fetchTrackerStatusByJobId(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<OperationStatusState | undefined> {
  const item = await findTrackerItem(jobId, scheduledTime, kanriNo);
  if (!item) return undefined;

  return {
    kanriNo,
    status: resolveStatus(item.status),
    startTime: item.start_time,
    endTime: item.end_time,
  };
}
