// electron/features/operation/infrastructure/tracker/trackerServiceClient.ts

import { isPreviousDayJob } from "@electron/features/operation/domain/operationRules";
import { getServiceCredentials } from "@electron/features/system/serviceCredentialsLoader";
import {
  JOB_STATUS,
  type OperationMaster,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  computeEarliestValidMs,
  getJstDayStartMs,
  getPreviousDayRange,
  resolveTrackerItemStatus,
  selectLatestTrackerItem,
  type TrackerApiResponseItem,
} from "./trackerItemSelector";

interface TrackerApiResponse {
  data: TrackerApiResponseItem[];
}

const TRACKER_FETCH_TIMEOUT_MS = 30_000;

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

function buildTrackerUrl(jobId: string, from?: string, to?: string): string {
  if (!isValidTrackerJobId(jobId)) {
    throw new Error("Tracker API の Job ID が未設定または不正です。");
  }
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
      const data = (await res.json()) as TrackerApiResponse;
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

  // 前日ジョブ（NMA8510, NMA8101 等）は、Tracker API に前日の from / to 範囲を指定して取得する
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