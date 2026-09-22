import {
  addKanshiTime,
  applyTrackerItem,
  buildTrackerUrl,
  getJobId,
  getTargetTime,
  normalizeItem,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@electron/features/operation/helpers/trackerHelper";
import { updateStatus } from "@electron/features/operation/statusManager";
import type {
  OperationItem,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";

export function hasJobId(target: OperationItem): boolean {
  if (
    target.executionType === "autoScript" ||
    target.executionType === "manualScript" ||
    target.executionType === "manual"
  ) {
    return false;
  }

  return getJobId(target) !== undefined;
}

async function fetchTrackerData(
  url: string,
  kanriNo: string | number,
  jobId: string,
  mode: "PRIMARY" | "FALLBACK",
): Promise<TrackerApiResponseItem[]> {
  console.log(
    `[TrackerAPI] Requesting (${mode}): No.${kanriNo} (jobId=${jobId})`,
    { url },
  );

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `[TrackerAPI] HTTP Error (${mode}): No.${kanriNo} status=${response.status}`,
      );
      return [];
    }

    const data = (await response.json()) as TrackerApiResponse;

    if (!data?.data?.length) {
      console.log(`[TrackerAPI] Response Empty (${mode}): No.${kanriNo}`);
      return [];
    }

    console.log(`[TrackerAPI] Response Received (${mode}): No.${kanriNo}`, {
      count: data.count,
      fetchedItemsCount: data.data.length,
      firstItem: data.data[0],
      firstStartTime: data.data[0]?.start_time ?? null,
      firstEndTime: data.data[0]?.end_time ?? null,
    });

    return data.data;
  } catch (error) {
    console.error(
      `[TrackerAPI] Network/Fetch Error (${mode}): No.${kanriNo}`,
      error,
    );

    return [];
  }
}

function logTrackerRequest(
  kanriNo: string | number,
  jobId: string,
  status?: string,
): void {
  console.log(
    `[TrackerService:REQ] Tracker API問い合わせ -> No.${kanriNo} (jobId=${jobId}, status=${status ?? "N/A"})`,
  );
}

function logTrackerResponse(
  kanriNo: string | number,
  jobId: string,
  tracker: OperationStatusState,
  updatedEntity: OperationItem,
): void {
  console.log(
    `[TrackerService:RES] No.${kanriNo} jobId=${jobId} ` +
      `API=${tracker.status ?? "N/A"} ` +
      `UI=${updatedEntity.status ?? "N/A"} ` +
      `start=${updatedEntity.startTime ?? ""} ` +
      `end=${updatedEntity.endTime ?? ""} ` +
      `comment=${updatedEntity.comment ?? ""}`,
  );
}

function logNoTrackerData(kanriNo: string | number, jobId: string): void {
  console.warn(
    `[TrackerService:RES] Tracker APIデータなし -> No.${kanriNo} (jobId=${jobId})`,
  );
}

function logTrackerError(
  kanriNo: string | number,
  jobId: string,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    `[TrackerService:ERR] Tracker API問い合わせ失敗 -> No.${kanriNo} (jobId=${jobId})`,
    message,
  );
}

export async function fetchTrackerByJobId(
  target: OperationItem,
): Promise<OperationStatusState[]> {
  const { kanriNo } = target;
  const jobId = getJobId(target);

  if (!kanriNo || !jobId) {
    return [];
  }

  const from = getTargetTime(kanriNo, target.scheduledTime);

  const to = addKanshiTime(from, target.kanshiTime);

  const primaryUrl = buildTrackerUrl(jobId, from, to);

  let rawItems = await fetchTrackerData(primaryUrl, kanriNo, jobId, "PRIMARY");

  if (rawItems.length === 0) {
    const fallbackUrl = buildTrackerUrl(jobId);

    rawItems = await fetchTrackerData(fallbackUrl, kanriNo, jobId, "FALLBACK");
  }

  if (rawItems.length === 0 || !rawItems[0]) {
    return [];
  }

  return [normalizeItem(rawItems[0])];
}

export async function syncTrackerStatus(
  target: OperationItem,
): Promise<OperationItem> {
  const jobId = getJobId(target);

  if (!jobId) {
    return target;
  }

  const { kanriNo } = target;

  logTrackerRequest(kanriNo, jobId, target.status);

  try {
    const trackerItems = await fetchTrackerByJobId(target);

    const tracker = trackerItems[0];

    if (!tracker) {
      logNoTrackerData(kanriNo, jobId);

      return target;
    }

    const updatedEntity = applyTrackerItem(tracker, target);

    logTrackerResponse(kanriNo, jobId, tracker, updatedEntity);

    updateStatus({
      ...updatedEntity,
      kanriNo,
    });

    return updatedEntity;
  } catch (error) {
    logTrackerError(kanriNo, jobId, error);

    return target;
  }
}
