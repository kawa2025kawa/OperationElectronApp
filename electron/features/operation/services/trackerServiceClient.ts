// electron/features/operation/services/trackerServiceClient.ts

import type { OperationItem } from "@shared/types/operation";
import {
  applyTrackerItem,
  normalizeItem,
  type TrackerApiResponse,
} from "../helpers/trackerMapper";
import {
  addKanshiTime,
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
  const primaryResponse = await fetch(primaryUrl);

  if (!primaryResponse.ok) {
    throw new Error(`Tracker API Error ${primaryResponse.status}`);
  }

  const primaryJson = (await primaryResponse.json()) as TrackerApiResponse;
  if (primaryJson.count > 0 && primaryJson.data.length > 0) {
    return primaryJson.data.map(normalizeItem);
  }

  // 時間範囲外の旧データ誤取得（誤完了判定）を防ぐため fallbackUrl 呼び出しを廃止
  return [];
}
