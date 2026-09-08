// electron/features/operation/services/trackerServiceClient.ts
import type { OperationItem } from "@shared/types/operation";
import {
  addKanshiTime,
  applyTrackerItem,
  buildFallbackTrackerUrl,
  buildTrackerUrl,
  getTargetTime,
  normalizeItem,
  sleep,
  validateJobId,
  type TrackerApiResponse,
} from "../helpers/trackerHelper";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 4000];

async function requestTrackerApi(
  url: string,
  jobId: string,
  label: string,
): Promise<Partial<OperationItem>[] | null> {
  if (jobId === "NMA8000")
    console.log(`[TrackerDebug] NMA8000 ${label} Request URL:`, url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tracker API ${label} Error ${res.status}`);

  const json = (await res.json()) as TrackerApiResponse;
  if (jobId === "NMA8000")
    console.log(
      `[TrackerDebug] NMA8000 ${label} Response:`,
      JSON.stringify(json, null, 2),
    );

  return json.count > 0 && json.data.length > 0
    ? json.data.map(normalizeItem)
    : null;
}

export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<Partial<OperationItem>[]> {
  const jobId = validateJobId(target);
  const from = getTargetTime(jobId, target.scheduledTime);
  const to = addKanshiTime(from, target.kanshiTime);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const primaryData = await requestTrackerApi(
        buildTrackerUrl(jobId, from, to),
        jobId,
        "Primary",
      );
      if (primaryData) return primaryData;

      const fallbackData = await requestTrackerApi(
        buildFallbackTrackerUrl(jobId),
        jobId,
        "Fallback",
      );
      if (fallbackData) return fallbackData;

      return [];
    } catch (error) {
      console.error(
        `[Tracker] request failed attempt=${attempt}/${MAX_RETRIES}`,
        { kanriNo: target.kanriNo, jobId, error },
      );
      if (attempt === MAX_RETRIES) return [];
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
  }
  return [];
}

export { applyTrackerItem };
