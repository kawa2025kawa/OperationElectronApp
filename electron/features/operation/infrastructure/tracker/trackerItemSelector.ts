// electron/features/operation/infrastructure/tracker/trackerItemSelector.ts

import { TZDate } from "@date-fns/tz";
import { addDays, addHours, addMinutes, startOfDay } from "date-fns";
import {
  isPreviousDayJob,
  parseHHMM,
  type ParsedTime,
} from "@electron/features/operation/domain/operationRules";
import {
  JOB_STATUS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

export interface TrackerApiResponseItem {
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
/** 手動起動時の時計ズレを考慮した解禁時刻の許容マージン（1分） */
const EARLIEST_MARGIN_MS = 60 * 1000;

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

export function getJstDayStartMs(nowMs: number = Date.now()): number {
  return startOfDay(new TZDate(nowMs, JST_TIME_ZONE)).getTime();
}

export function getPreviousDayRange(
  kanriNo: string,
  scheduledTime?: string | null,
  nowMs: number = Date.now(),
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

/**
 * 実績として有効とみなす最も早い時刻（下限タイムスタンプ）を算出する。
 */
export function computeEarliestValidMs(
  kanriNo: string,
  scheduledTime: string | null | undefined,
  jobId: string,
  nowMs: number = Date.now(),
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
  const scheduledMs = createJstDate(
    nowMs,
    dayOffset,
    time.hours,
    time.minutes,
  ).getTime();

  return scheduledMs - EARLIEST_MARGIN_MS;
}

function parseTimestamp(raw?: string | null): number {
  if (!raw) return Number.NaN;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

export function resolveTrackerItemStatus(
  statuses: string[],
): JobStatus | undefined {
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

/** 条件を満たす要素のうち、スコアが最大（または最小）の1件を線形走査で取得する */
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

    const isBetter = mode === "max" ? score > bestScore : score < bestScore;
    if (isBetter) {
      bestScore = score;
      bestItem = entry.item;
    }
  }

  return bestItem;
}

/**
 * 解禁時刻（earliestValidMs）以降〜上限時刻の間で、最も新しい実行結果を選定する。
 */
export function selectLatestTrackerItem(
  items: readonly TrackerApiResponseItem[],
  earliestValidMs: number,
  nowMs: number = Date.now(),
  upcomingUpperBoundMs: number = Number.POSITIVE_INFINITY,
): TrackerApiResponseItem | undefined {
  if (items.length === 0) return undefined;

  const annotated = items.map(annotateItem);

  // 1. 解禁時刻以降で現在実行中のレコードがあれば最優先
  const runningItem = pickBestItem(
    annotated,
    ({ isRunning, baseTs }) =>
      isRunning && !Number.isNaN(baseTs) && baseTs >= earliestValidMs
        ? baseTs
        : null,
    "max",
  );
  if (runningItem) return runningItem;

  // 2. 解禁時刻以降〜現在時刻までに完了（SUCCESS）になった一番最新のレコード
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

  // 3. 解禁時刻以降〜現在時刻までに実開始された最新レコード（エラーや待機含む）
  const startedItem = pickBestItem(
    annotated,
    ({ startTs }) =>
      !Number.isNaN(startTs) && startTs >= earliestValidMs && startTs <= nowMs
        ? startTs
        : null,
    "max",
  );
  if (startedItem) return startedItem;

  // 4. まだ1件も開始されていない場合は、解禁時刻以降の予定レコードから最も近いものを返す
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
