// electron/features/operation/services/trackerServiceClient.ts

import {
  applyTrackerItem,
  buildFallbackTrackerUrl,
  buildTrackerUrl,
  getTargetTime,
  addKanshiTime,
  normalizeItem,
  validateJobId,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@electron/features/operation/helpers/trackerHelper";
import type { OperationItem } from "@shared/types/operation";

export { applyTrackerItem };

async function fetchTrackerData(
  url: string,
  kanriNo: string,
  jobId: string,
  isFallback = false,
): Promise<TrackerApiResponseItem[]> {
  const modeLabel = isFallback ? "FALLBACK" : "PRIMARY";
  console.log(
    `[TrackerAPI] Requesting (${modeLabel}): No.${kanriNo} (jobId=${jobId})`,
    { url },
  );

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(
        `[TrackerAPI] HTTP Error (${modeLabel}): No.${kanriNo} (status=${res.status})`,
      );
      return [];
    }

    const data = (await res.json()) as TrackerApiResponse;
    const items = data?.data ?? [];

    console.log(
      `[TrackerAPI] Response Received (${modeLabel}): No.${kanriNo}`,
      {
        count: data?.count ?? 0,
        fetchedItemsCount: items.length,
        latestStatus: items[0]?.status ?? "N/A",
      },
    );

    return items;
  } catch (error) {
    console.error(
      `[TrackerAPI] Network/Fetch Error (${modeLabel}): No.${kanriNo}`,
      error,
    );
    return [];
  }
}

/**
 * jobId 指定で Tracker API から状態データを取得
 */
export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<Partial<OperationItem>[]> {
  const kanriNo = String(target.kanriNo).trim();
  const jobId = validateJobId(target);

  const from = getTargetTime(jobId, target.scheduledTime);
  const to = addKanshiTime(from, target.kanshiTime);
  const url = buildTrackerUrl(jobId, from, to);

  let rawItems = await fetchTrackerData(url, kanriNo, jobId, false);

  if (rawItems.length === 0) {
    const fallbackUrl = buildFallbackTrackerUrl(jobId);
    console.log(
      `[TrackerAPI] Retrying with fallback URL for No.${kanriNo} (jobId=${jobId})`,
    );
    rawItems = await fetchTrackerData(fallbackUrl, kanriNo, jobId, true);
  }

  if (rawItems.length === 0) {
    console.warn(
      `[TrackerAPI] No tracker data found for No.${kanriNo} (jobId=${jobId})`,
    );
  }

  return rawItems.map(normalizeItem);
}
