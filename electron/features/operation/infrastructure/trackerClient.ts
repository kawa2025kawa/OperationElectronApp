// electron/features/operation/infrastructure/trackerClient.ts

import { TZDate } from "@date-fns/tz";
import { addDays, addHours, addMinutes, startOfDay } from "date-fns";
import {
  isPreviousDayJob,
  parseHHMM,
  type ParsedTime,
} from "@electron/features/operation/domain/operationRules";
import { getServiceCredentials } from "@electron/features/system/systemService";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationMaster,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

interface TrackerApiResponseItem {
  start_time: string | null;
  end_time: string | null;
  expected_start_time?: string | null;
  status: string[];
}

interface AnnotatedTrackerItem {
  readonly item: TrackerApiResponseItem;
  readonly resolvedStatus: JobStatus | undefined;
  readonly startTs: number;
  readonly endTs: number;
  readonly baseTs: number;
  readonly isRunning: boolean;
}

const JST_TIME_ZONE = "Asia/Tokyo" as const;
const DEFAULT_KANSHI_TIME = { hours: 1, minutes: 0 } as const;
const EARLIEST_MARGIN_MS = 60_000;
const TRACKER_FETCH_TIMEOUT_MS = 30_000;

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
const inFlightRequests = new Map<string, Promise<TrackerApiResponseItem[]>>();

export function getJobId(target: OperationMaster): string | undefined {
  const jobId = target.jobId?.trim();
  return jobId && jobId !== "-" ? jobId : undefined;
}

function parseJobIdTime(jobId?: string | null): ParsedTime | null {
  if (!jobId) return null;

  const colonTime = parseHHMM(jobId);
  if (colonTime) return colonTime;

  const jpMatch = jobId.match(/(\d{1,2})時(\d{1,2})分?/);
  if (!jpMatch) return null;

  const hours = Number(jpMatch[1]);
  const minutes = Number(jpMatch[2]);
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null;
}

function createJstDate(
  nowMs: number,
  dayOffset: number,
  hours: number,
  minutes: number,
): TZDate {
  const base = addDays(new TZDate(nowMs, JST_TIME_ZONE), dayOffset);
  return new TZDate(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hours,
    minutes,
    0,
    0,
    JST_TIME_ZONE,
  );
}

function getJstDayStartMs(nowMs: number): number {
  return startOfDay(new TZDate(nowMs, JST_TIME_ZONE)).getTime();
}

function getPreviousDayRange(
  kanriNo: string,
  scheduledTime: string | null | undefined,
  nowMs: number,
): { from: string; to: string; toMs: number } {
  const jstNow = new TZDate(nowMs, JST_TIME_ZONE);
  const time = parseHHMM(scheduledTime);
  const hours = time?.hours ?? jstNow.getHours();
  const minutes = time?.minutes ?? jstNow.getMinutes();
  const dayOffset = isPreviousDayJob(kanriNo) ? -1 : 0;

  const fromDate = createJstDate(nowMs, dayOffset, hours, minutes);
  const toDate = addMinutes(
    addHours(fromDate, DEFAULT_KANSHI_TIME.hours),
    DEFAULT_KANSHI_TIME.minutes,
  );

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    toMs: toDate.getTime(),
  };
}

function computeEarliestValidMs(
  kanriNo: string,
  scheduledTime: string | null | undefined,
  jobId: string,
  nowMs: number,
): number {
  const jobTime = parseJobIdTime(jobId);
  const scheduled = parseHHMM(scheduledTime);
  const time =
    jobTime && scheduled
      ? jobTime.hours * 60 + jobTime.minutes <
        scheduled.hours * 60 + scheduled.minutes
        ? jobTime
        : scheduled
      : (jobTime ?? scheduled);

  if (!time) {
    return getJstDayStartMs(nowMs);
  }

  const dayOffset = isPreviousDayJob(kanriNo) ? -1 : 0;
  return (
    createJstDate(nowMs, dayOffset, time.hours, time.minutes).getTime() -
    EARLIEST_MARGIN_MS
  );
}

function parseTimestamp(raw?: string | null): number {
  if (!raw) return Number.NaN;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function resolveTrackerItemStatus(statuses: string[]): JobStatus | undefined {
  if (statuses.length === 0) return undefined;

  let firstStatus: JobStatus | undefined;
  for (let i = 0; i < statuses.length; i++) {
    const normalized = statuses[i]
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    const mapped = STATUS_ALIAS_MAP[normalized];
    if (mapped === JOB_STATUS.ERROR) {
      return JOB_STATUS.ERROR;
    }
    if (i === 0) {
      firstStatus = mapped;
    }
  }
  return firstStatus;
}

function annotateItem(item: TrackerApiResponseItem): AnnotatedTrackerItem {
  const startTs = parseTimestamp(item.start_time);
  const endTs = parseTimestamp(item.end_time);
  const expectedTs = parseTimestamp(item.expected_start_time);
  const resolvedStatus = resolveTrackerItemStatus(item.status);

  return {
    item,
    resolvedStatus,
    startTs,
    endTs,
    baseTs: !Number.isNaN(startTs) ? startTs : expectedTs,
    isRunning:
      resolvedStatus === JOB_STATUS.RUNNING ||
      resolvedStatus === JOB_STATUS.SCRIPT_RUNNING,
  };
}

function pickBestItem(
  items: readonly AnnotatedTrackerItem[],
  scoreFn: (entry: AnnotatedTrackerItem) => number | null,
  mode: "max" | "min",
): TrackerApiResponseItem | undefined {
  let bestItem: TrackerApiResponseItem | undefined;
  let bestScore =
    mode === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const entry of items) {
    const score = scoreFn(entry);
    if (score === null || Number.isNaN(score)) continue;

    if (mode === "max" ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestItem = entry.item;
    }
  }

  return bestItem;
}

function selectLatestTrackerItem(
  items: readonly TrackerApiResponseItem[],
  earliestValidMs: number,
  nowMs: number,
  upcomingUpperBoundMs: number = Number.POSITIVE_INFINITY,
): TrackerApiResponseItem | undefined {
  if (items.length === 0) return undefined;

  const annotated = items.map(annotateItem);

  const runningItem = pickBestItem(
    annotated,
    ({ isRunning, baseTs }) =>
      isRunning && !Number.isNaN(baseTs) && baseTs >= earliestValidMs
        ? baseTs
        : null,
    "max",
  );
  if (runningItem) return runningItem;

  const completedItem = pickBestItem(
    annotated,
    ({ resolvedStatus, startTs, endTs, baseTs }) => {
      if (resolvedStatus !== JOB_STATUS.SUCCESS) return null;
      const completedTs = !Number.isNaN(endTs) ? endTs : baseTs;
      return !Number.isNaN(completedTs) &&
        completedTs >= earliestValidMs &&
        completedTs <= nowMs &&
        (Number.isNaN(startTs) || startTs >= earliestValidMs)
        ? completedTs
        : null;
    },
    "max",
  );
  if (completedItem) return completedItem;

  const startedItem = pickBestItem(
    annotated,
    ({ startTs }) =>
      !Number.isNaN(startTs) && startTs >= earliestValidMs && startTs <= nowMs
        ? startTs
        : null,
    "max",
  );
  if (startedItem) return startedItem;

  return pickBestItem(
    annotated,
    ({ baseTs }) =>
      !Number.isNaN(baseTs) &&
      baseTs >= earliestValidMs &&
      baseTs <= upcomingUpperBoundMs
        ? baseTs
        : null,
    "min",
  );
}

function buildTrackerUrl(jobId: string, from?: string, to?: string): string {
  const { apiKey, apiBaseUrl } = getServiceCredentials().tracker;
  const params = new URLSearchParams({
    api_key: apiKey,
    jobnetwork_name: jobId.trim(),
  });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `${apiBaseUrl}?${params.toString()}`;
}

async function fetchTrackerData(
  url: string,
): Promise<TrackerApiResponseItem[]> {
  const existing = inFlightRequests.get(url);
  if (existing) return existing;

  const requestPromise = (async () => {
    const reqId = ++requestSequence;
    const start = Date.now();
    console.log(
      `[${new Date().toISOString()}] [TrackerClient] #${reqId} START`,
      { url: url.replace(/api_key=[^&]+/, "api_key=***") },
    );

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      TRACKER_FETCH_TIMEOUT_MS,
    );

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        console.error(
          `[${new Date().toISOString()}] [TrackerClient] #${reqId} HTTP ${res.status}`,
          { ms: Date.now() - start },
        );
        return [];
      }
      const data = (await res.json()) as { data?: TrackerApiResponseItem[] };
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [TrackerClient] #${reqId} ERROR`,
        { error },
      );
      return [];
    } finally {
      clearTimeout(timer);
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, requestPromise);
  return requestPromise;
}

async function findTrackerItem(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<TrackerApiResponseItem | undefined> {
  const nowMs = Date.now();
  const earliestValidMs = computeEarliestValidMs(
    kanriNo,
    scheduledTime,
    jobId,
    nowMs,
  );

  if (isPreviousDayJob(kanriNo)) {
    const { from, to, toMs } = getPreviousDayRange(
      kanriNo,
      scheduledTime,
      nowMs,
    );
    const rangeItems = await fetchTrackerData(buildTrackerUrl(jobId, from, to));
    if (rangeItems.length > 0) {
      return (
        selectLatestTrackerItem(rangeItems, earliestValidMs, nowMs, toMs) ??
        rangeItems[0]
      );
    }

    const fallbackItems = await fetchTrackerData(buildTrackerUrl(jobId));
    return selectLatestTrackerItem(
      fallbackItems,
      earliestValidMs,
      nowMs,
      getJstDayStartMs(nowMs),
    );
  }

  const allItems = await fetchTrackerData(buildTrackerUrl(jobId));
  return selectLatestTrackerItem(allItems, earliestValidMs, nowMs);
}

export async function fetchTrackerStatusByJobId(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<OperationStatusState | undefined> {
  const item = await findTrackerItem(jobId, scheduledTime, kanriNo);
  if (!item) return undefined;

  const status = resolveTrackerItemStatus(item.status);
  return {
    kanriNo,
    status,
    errorSource: status === JOB_STATUS.ERROR ? "tracker" : null,
    startTime: item.start_time,
    endTime: item.end_time,
  };
}
