// electron/features/operation/application/trackerStatusService.ts

import { getTargetByKanriNo } from "@electron/features/operation/application/statusManager";
import { applyTrackerStatus } from "@electron/features/operation/application/operationStatusEvaluator";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { isValidTrackerJobId } from "@electron/features/operation/infrastructure/tracker/trackerHelper";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";

export async function fetchSingleTrackerStatus(kanriNoInput: string) {
  const kanriNo = normalizeKanriNo(kanriNoInput);
  const target = getTargetByKanriNo(kanriNo);

  if (
    !target ||
    target.targetType !== "operation" ||
    !isValidTrackerJobId(target.jobId)
  ) {
    throw new Error(
      `Tracker target not found or Job ID is not configured (kanriNo=${kanriNo})`,
    );
  }

  const trackerStatus = await fetchTrackerStatusByJobId(
    target.jobId.trim(),
    target.scheduledTime,
    target.kanriNo,
  );

  if (!trackerStatus) {
    return {
      kanriNo,
      status: undefined,
      comment: "Trackerステータス取得失敗",
    };
  }

  applyTrackerStatus(trackerStatus);
  return trackerStatus;
}
