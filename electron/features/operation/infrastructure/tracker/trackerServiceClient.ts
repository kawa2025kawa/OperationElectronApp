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

interface TrackerApiResponseItem {
  start_time: string | null;
  end_time: string | null;
  expected_start_time?: string | null;
  status: string[];
}

interface TrackerApiResponse {
  data: TrackerApiResponseItem[];
}

interface AnnotatedTrackerItem {
  readonly item: TrackerApiResponseItem;
  readonly resolvedStatus: JobStatus | undefined;
  readonly startTs: number;
  readonly endTs: number;
  readonly baseTs: number;
  readonly isRunning: boolean;
}

const TRACKER_CONFIG = {
  apiKey: "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91",
  apiBaseUrl: "http://192.88.1.152/api/v2/trackers",
  timezoneOffsetHours: 9,
  fetchTimeoutMs: 30_000,
  defaultKanshiTime: { hours: 1, minutes: 0 },
  /** 手動起動時の時計ズレを考慮した解禁時刻の許容マージン（1分） */
  earliestMarginMs: 60 * 1000,
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
const inFlightRequests = new Map<string, Promise<TrackerApiResponseItem[]>>();

function isValidTrackerJobId(
  jobId: string | null | undefined,
): jobId is string {
  const norm = jobId?.trim();
  return Boolean(norm && norm !== "-");
}

export function getJobId(target: OperationMaster): string | undefined {
  const jobId = target.jobId?.trim();
  return isValidTrackerJobId(jobId) ? jobId : undefined;
}

function getTargetTime(
  kanriNo: string,
  scheduledTime?: string | null,
  nowMs: number = Date.now(),
): string {
  const now = new Date(nowMs);
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
  if (!isValidTrackerJobId(jobId)) {
    throw new Error("Tracker API の Job ID が未設定または不正です。");
  }
  const params = new URLSearchParams({
    api_key: TRACKER_CONFIG.apiKey,
    jobnetwork_name: jobId.trim(),
  });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `${TRACKER_CONFIG.apiBaseUrl}?${params.toString()}`;
}

function getJstDayStartMs(nowMs: number = Date.now()): number {
  const jstNow = new Date(
    nowMs + TRACKER_CONFIG.timezoneOffsetHours * 3600_000,
  );
  return Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate(),
    -TRACKER_CONFIG.timezoneOffsetHours,
    0,
  );
}

/**
 * 実績として有効とみなす最も早い時刻（下限タイムスタンプ）を算出する。
 * - scheduledTime に時刻（例: 9:22, 14:22, 16:02）がある場合は、その解禁時刻（-1分マージン）
 * - scheduledTime が「手動」など時刻未指定の場合は、当日 00:00 JST
 */
function computeEarliestValidMs(
  kanriNo: string,
  scheduledTime?: string | null,
  nowMs: number = Date.now(),
): number {
  const time = parseHHMM(scheduledTime);
  if (!time) {
    return getJstDayStartMs(nowMs);
  }

  const now = new Date(nowMs);
  const dayOffset = isPreviousDayJob(kanriNo, scheduledTime) ? -1 : 0;
  const scheduledMs = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    time.hours - TRACKER_CONFIG.timezoneOffsetHours,
    time.minutes,
  );

  return scheduledMs - TRACKER_CONFIG.earliestMarginMs;
}

function parseTimestamp(raw?: string | null): number {
  if (!raw) return Number.NaN;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function resolveStatus(statuses: string[]): JobStatus | undefined {
  if (statuses.length === 0) return undefined;
  const list = statuses.map((s) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, ""),
  );
  if (list.some((s) => STATUS_ALIAS_MAP[s] === JOB_STATUS.ERROR)) {
    return JOB_STATUS.ERROR;
  }
  return STATUS_ALIAS_MAP[list[0]];
}

function annotateItems(
  items: readonly TrackerApiResponseItem[],
): AnnotatedTrackerItem[] {
  return items.map((item) => {
    const startTs = parseTimestamp(item.start_time);
    const endTs = parseTimestamp(item.end_time);
    const expectedTs = parseTimestamp(item.expected_start_time);
    const resolvedStatus = resolveStatus(item.status);
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
  });
}

/**
 * 解禁時刻（earliestValidMs）以降〜上限時刻の間で、最も新しい実行結果を選定する。
 * - 解禁時刻より前の完了実績（例: 14:22解禁のジョブに対する13:03完了）は一切拾わない。
 * - 優先順位:
 *   1. 解禁時刻以降に開始された現在実行中（run / running）の最新レコード
 *   2. 解禁時刻以降〜現在時刻までに完了（done / success）になった一番最新のレコード
 *   3. 解禁時刻以降〜現在時刻までに開始された最新レコード（エラー等）
 *   4. まだ未実行の場合は、解禁時刻〜upcomingUpperBoundMs 内の予定レコード（wait / scheduled）
 */
function selectLatestItemAfterEarliest(
  items: readonly TrackerApiResponseItem[],
  earliestValidMs: number,
  nowMs: number = Date.now(),
  upcomingUpperBoundMs: number = Number.POSITIVE_INFINITY,
): TrackerApiResponseItem | undefined {
  if (items.length === 0) return undefined;

  const annotated = annotateItems(items);

  // 1. 解禁時刻以降で現在実行中のレコードがあれば最優先
  const running = annotated
    .filter(
      ({ isRunning, baseTs }) =>
        isRunning && !Number.isNaN(baseTs) && baseTs >= earliestValidMs,
    )
    .sort((a, b) => b.baseTs - a.baseTs);

  if (running.length > 0) return running[0].item;

  // 2. 解禁時刻以降〜現在時刻までに完了（SUCCESS）になった一番最新のレコード
  const completed = annotated
    .filter(({ resolvedStatus }) => resolvedStatus === JOB_STATUS.SUCCESS)
    .map((entry) => ({
      ...entry,
      completedTs: !Number.isNaN(entry.endTs) ? entry.endTs : entry.baseTs,
    }))
    .filter(
      ({ startTs, completedTs }) =>
        !Number.isNaN(completedTs) &&
        completedTs >= earliestValidMs &&
        completedTs <= nowMs &&
        (Number.isNaN(startTs) || startTs >= earliestValidMs),
    )
    .sort((a, b) => b.completedTs - a.completedTs);

  if (completed.length > 0) return completed[0].item;

  // 3. 解禁時刻以降〜現在時刻までに実開始された最新レコード（エラーや待機含む）
  const started = annotated
    .filter(
      ({ startTs }) =>
        !Number.isNaN(startTs) &&
        startTs >= earliestValidMs &&
        startTs <= nowMs,
    )
    .sort((a, b) => b.startTs - a.startTs);

  if (started.length > 0) return started[0].item;

  // 4. まだ1件も開始されていない場合は、解禁時刻以降の予定レコードから最も近いもの（wait 等）を返す
  const upcoming = annotated
    .filter(
      ({ baseTs }) =>
        !Number.isNaN(baseTs) &&
        baseTs >= earliestValidMs &&
        baseTs <= upcomingUpperBoundMs,
    )
    .sort((a, b) => a.baseTs - b.baseTs);

  return upcoming[0]?.item;
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
      { url },
    );

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
  const earliestValidMs = computeEarliestValidMs(kanriNo, scheduledTime, nowMs);

  // 前日ジョブ（NMA8510, NMA8101 等）は、Tracker API に前日の from / to 範囲を指定して取得する
  if (isPreviousDayJob(kanriNo, scheduledTime)) {
    const from = getTargetTime(kanriNo, scheduledTime, nowMs);
    const to = addKanshiTime(from);
    const rangeItems = await fetchTrackerData(buildTrackerUrl(jobId, from, to));
    if (rangeItems.length > 0) {
      return (
        selectLatestItemAfterEarliest(
          rangeItems,
          earliestValidMs,
          nowMs,
          Date.parse(to),
        ) ?? rangeItems[0]
      );
    }

    const fallbackItems = await fetchTrackerData(buildTrackerUrl(jobId));
    return selectLatestItemAfterEarliest(
      fallbackItems,
      earliestValidMs,
      nowMs,
      getJstDayStartMs(nowMs),
    );
  }

  const allItems = await fetchTrackerData(buildTrackerUrl(jobId));
  return selectLatestItemAfterEarliest(allItems, earliestValidMs, nowMs);
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
