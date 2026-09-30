// electron/features/operation/services/trackerServiceClient.ts

import {
  addKanshiTime,
  buildTrackerUrl,
  getJobId,
  getTargetTime,
  normalizeItem,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@electron/features/operation/helpers/trackerHelper";

import type { OperationStatusState } from "@shared/types/operation/operationTypes";

import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

const FETCH_TIMEOUT_MS = 30_000;

async function fetchTrackerData(
  url: string,
): Promise<TrackerApiResponseItem[]> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        "[TrackerServiceClient] API request failed:",
        response.status,
        response.statusText,
      );

      return [];
    }

    const data = (await response.json()) as TrackerApiResponse;

    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[TrackerServiceClient] API request timed out:", url);
    } else {
      console.error("[TrackerServiceClient] API request failed:", error);
    }

    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function hasJobId(target: OperationMaster): boolean {
  return Boolean(getJobId(target));
}

async function findTrackerItem(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<TrackerApiResponseItem | undefined> {
  const from = getTargetTime(kanriNo, scheduledTime);

  const to = addKanshiTime(from);

  const rangeItems = await fetchTrackerData(buildTrackerUrl(jobId, from, to));

  if (rangeItems.length > 0) {
    return rangeItems[0];
  }

  const fallbackItems = await fetchTrackerData(buildTrackerUrl(jobId));

  return fallbackItems[0];
}

export async function fetchTrackerStatusByJobId(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<OperationStatusState | undefined> {
  const item = await findTrackerItem(jobId, scheduledTime, kanriNo);

  if (!item) {
    return undefined;
  }

  /*
   * Raw Tracker API ->
   * OperationStatusState の唯一の変換境界。
   */
  return normalizeItem(kanriNo, item);
}
