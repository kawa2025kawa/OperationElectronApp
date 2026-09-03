// electron/features/operation/services/trackerServiceClient.ts

import type { OperationItem } from "@shared/types/operation";
import {
  applyTrackerItem,
  normalizeItem,
  type TrackerApiResponse,
} from "../helpers/trackerMapper";
import {
  addKanshiTime,
  buildFallbackTrackerUrl,
  buildTrackerUrl,
  getTargetTime,
} from "../helpers/trackerUrlHelper";
import { sleep, validateJobId } from "../helpers/trackerValidationHelper";

// ============================================================
// Constants
// ============================================================
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2_000, 4_000];

// ============================================================
// Public APIs
// ============================================================
export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<Partial<OperationItem>[]> {
  const jobId = validateJobId(target);
  const from = getTargetTime(jobId, target.scheduledTime);
  const to = addKanshiTime(from, target.kanshiTime);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await requestTracker(jobId, from, to);
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

export { applyTrackerItem };

// ============================================================
// HTTP Requests
// ============================================================
async function requestTracker(
  jobId: string,
  from: string,
  to: string,
): Promise<Partial<OperationItem>[]> {
  const primaryUrl = buildTrackerUrl(jobId, from, to);

  if (jobId === "NMA8000") {
    console.log("[TrackerDebug] NMA8000 Primary Request URL:", primaryUrl);
  }

  const primaryResponse = await fetch(primaryUrl);

  if (!primaryResponse.ok) {
    throw new Error(`Tracker API Primary Error ${primaryResponse.status}`);
  }

  const primaryJson = (await primaryResponse.json()) as TrackerApiResponse;

  if (jobId === "NMA8000") {
    console.log(
      "[TrackerDebug] NMA8000 Primary Response:",
      JSON.stringify(primaryJson, null, 2),
    );
  }

  // 1. 一次検索（時間指定）で取得できた場合はそのまま返却
  if (primaryJson.count > 0 && primaryJson.data.length > 0) {
    return primaryJson.data.map(normalizeItem);
  }

  // 2. 一次検索でデータが空だった場合、from/to無しのフォールバックURLで再問い合わせ
  const fallbackUrl = buildFallbackTrackerUrl(jobId);

  if (jobId === "NMA8000") {
    console.log("[TrackerDebug] NMA8000 Fallback Request URL:", fallbackUrl);
  }

  const fallbackResponse = await fetch(fallbackUrl);

  if (!fallbackResponse.ok) {
    throw new Error(`Tracker API Fallback Error ${fallbackResponse.status}`);
  }

  const fallbackJson = (await fallbackResponse.json()) as TrackerApiResponse;

  if (jobId === "NMA8000") {
    console.log(
      "[TrackerDebug] NMA8000 Fallback Response:",
      JSON.stringify(fallbackJson, null, 2),
    );
  }

  if (fallbackJson.count > 0 && fallbackJson.data.length > 0) {
    return fallbackJson.data.map(normalizeItem);
  }

  return [];
}
