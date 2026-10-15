// electron/features/operation/infrastructure/tracker/trackerServiceClient.ts

import {
  addKanshiTime,
  buildTrackerUrl,
  getJobId,
  getTargetTime,
  normalizeItem,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@electron/features/operation/infrastructure/tracker/trackerHelper";

import {
  type OperationMaster,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

const FETCH_TIMEOUT_MS = 30_000;

let requestSequence = 0;

function getSafeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.searchParams.has("api_key")) {
      parsedUrl.searchParams.set("api_key", "********");
    }

    return parsedUrl.toString();
  } catch {
    return url.replace(/([?&]api_key=)[^&]*/i, "$1********");
  }
}

async function fetchTrackerData(
  url: string,
): Promise<TrackerApiResponseItem[]> {
  const requestId = ++requestSequence;
  const timestamp = new Date().toISOString();
  const safeUrl = getSafeUrl(url);

  console.log(
    `[${timestamp}] [TrackerServiceClient] Request #${requestId} START`,
    {
      method: "GET",
      url: safeUrl,
      timeoutMs: FETCH_TIMEOUT_MS,
    },
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;

    console.log(
      `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} RESPONSE`,
      {
        url: safeUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        elapsedMs,
      },
    );

    if (!response.ok) {
      let responseBody: string;

      try {
        responseBody = await response.text();
      } catch (error) {
        responseBody = `レスポンス本文の取得失敗: ${String(error)}`;
      }

      console.error(
        `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} HTTP ERROR`,
        {
          url: safeUrl,
          status: response.status,
          statusText: response.statusText,
          responseBody: responseBody.slice(0, 5000),
        },
      );

      return [];
    }

    const data = (await response.json()) as TrackerApiResponse;

    console.log(
      `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} RESPONSE DATA`,
    );
    console.dir(data, { depth: null });

    if (!Array.isArray(data.data)) {
      console.error(
        `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} INVALID RESPONSE`,
        {
          url: safeUrl,
          responseType: typeof data,
          dataType: typeof data.data,
        },
      );

      return [];
    }

    console.log(
      `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} STATUSES`,
      data.data.map((item) => item.status),
    );

    console.log(
      `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} SUCCESS`,
      {
        url: safeUrl,
        itemCount: data.data.length,
        elapsedMs,
      },
    );

    return data.data;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    if (error instanceof Error && error.name === "AbortError") {
      console.error(
        `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} TIMEOUT`,
        {
          url: safeUrl,
          timeoutMs: FETCH_TIMEOUT_MS,
          elapsedMs,
        },
      );
    } else {
      console.error(
        `[${new Date().toISOString()}] [TrackerServiceClient] Request #${requestId} NETWORK ERROR`,
        {
          url: safeUrl,
          elapsedMs,
          error,
        },
      );
    }

    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function findTrackerItem(
  jobId: string,
  scheduledTime: string | null | undefined,
  kanriNo: string,
): Promise<TrackerApiResponseItem | undefined> {
  const from = getTargetTime(kanriNo, scheduledTime);
  const to = addKanshiTime(from);

  const rangeUrl = buildTrackerUrl(jobId, from, to);

  console.log(
    `[${new Date().toISOString()}] [TrackerServiceClient] Range query`,
    {
      kanriNo,
      jobId,
      from,
      to,
      url: getSafeUrl(rangeUrl),
    },
  );

  const rangeItems = await fetchTrackerData(rangeUrl);

  if (rangeItems.length > 0) {
    return rangeItems[0];
  }

  const fallbackUrl = buildTrackerUrl(jobId);

  console.warn(
    `[${new Date().toISOString()}] [TrackerServiceClient] Range query returned no items; trying fallback`,
    {
      kanriNo,
      jobId,
      url: getSafeUrl(fallbackUrl),
    },
  );

  const fallbackItems = await fetchTrackerData(fallbackUrl);

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
