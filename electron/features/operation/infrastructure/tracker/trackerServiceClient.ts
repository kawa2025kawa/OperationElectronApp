// electron\features\operation\infrastructure\tracker\trackerServiceClient.ts

import {
  addKanshiTime,
  buildTrackerUrl,
  getJobId,
  getTargetTime,
  normalizeItem,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@electron/features/operation/infrastructure/tracker/trackerHelper";

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
        `[${new Date().toISOString()}] [TrackerServiceClient] API request failed:`,
        response.status,
        response.statusText,
      );

      return [];
    }

    const data = (await response.json()) as TrackerApiResponse;

    // ログ出力時間の取得 (ISO形式: 例 2026-10-06T09:22:44.123Z)
    // 日本時間表記にしたい場合は new Date().toLocaleString("ja-JP") をお使いください
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [TrackerServiceClient] API Raw Response Data:`);
    // オブジェクトの深い階層まで省略せずに全て出力
    console.dir(data, { depth: null });

    // status 配列のみを抽出して出力
    console.log(
      `[${timestamp}] [TrackerServiceClient] Statuses:`,
      data.data.map((item) => item.status),
    );

    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    const timestamp = new Date().toISOString();
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(
        `[${timestamp}] [TrackerServiceClient] API request timed out:`,
        url,
      );
    } else {
      console.error(
        `[${timestamp}] [TrackerServiceClient] API request failed:`,
        error,
      );
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
