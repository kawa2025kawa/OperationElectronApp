// src/renderer/features/operation/helpers/statusEvaluator.ts

import { commands } from "@shared/service/commands";
import type { AppState } from "@shared/store";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";
import { isJobTimedOut, isScheduledTimePassed } from "@shared/utils/dateUtils";
import { checkJobDependencies, getDependentKanriNos } from "./dependencyHelper";
import { findEntityByKanriNo, getAllEntities } from "./operationEntities";

const FINAL_STATUSES = new Set<string>([JOB_STATUS.SUCCESS, JOB_STATUS.ERROR]);

function extractActiveFlags(
  state?: Pick<AppState, "is1CActive" | "is2CActive" | "is3CActive">,
): Record<string, boolean> | undefined {
  if (!state) return undefined;
  return {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };
}

export function calculateNextStatus(
  entity: OperationItem,
  externalStatus: JobStatus | undefined,
  allEntities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): JobStatus {
  if (
    externalStatus === JOB_STATUS.SUCCESS ||
    externalStatus === JOB_STATUS.ERROR ||
    externalStatus === JOB_STATUS.RUNNING
  ) {
    return externalStatus;
  }

  if (entity.status && FINAL_STATUSES.has(entity.status)) {
    return entity.status;
  }

  if (
    entity.status === JOB_STATUS.RUNNING ||
    entity.status === JOB_STATUS.SCRIPT_RUNNING
  ) {
    if (isJobTimedOut(entity.startTime, entity.kanshiTime)) {
      console.warn(`[statusEvaluator] Job ${entity.kanriNo} timed out.`);
      return JOB_STATUS.ERROR;
    }
    return entity.status;
  }

  if (entity.dependency) {
    const depsMet = checkJobDependencies(
      entity.kanriNo,
      allEntities,
      activeFlags,
    ).ok;
    if (!depsMet) {
      return JOB_STATUS.SCHEDULED;
    }
  }

  return isScheduledTimePassed(entity.scheduledTime)
    ? JOB_STATUS.READY
    : JOB_STATUS.SCHEDULED;
}

export function refreshDependentStatuses(
  state: AppState,
  changedKanriNo: string,
): void {
  const activeFlags = extractActiveFlags(state);
  const allEntities = getAllEntities(state);

  const queue = [String(changedKanriNo)];

  // 全ジョブ完了依存のあるジョブ（KanriNo 81等）をキューに含める
  Object.values(allEntities).forEach((entity) => {
    if (entity.dependency?.requiresAllJobsSuccess) {
      queue.push(String(entity.kanriNo));
    }
  });

  const processed = new Set<string>();

  while (queue.length > 0) {
    const currentKanriNo = queue.shift();
    if (!currentKanriNo || processed.has(currentKanriNo)) continue;
    processed.add(currentKanriNo);

    const currentEntity = findEntityByKanriNo(state, currentKanriNo);
    if (currentEntity) {
      const selfNextStatus = calculateNextStatus(
        currentEntity,
        undefined,
        allEntities,
        activeFlags,
      );
      if (currentEntity.status !== selfNextStatus) {
        currentEntity.status = selfNextStatus;
        void commands.updateJobStatus(
          currentKanriNo,
          selfNextStatus,
          currentEntity.comment ?? "",
        );
      }
    }

    const dependentKanriNos = getDependentKanriNos(currentKanriNo, allEntities);
    for (const depKanriNo of dependentKanriNos) {
      if (!processed.has(depKanriNo)) {
        queue.push(depKanriNo);
      }
    }
  }
}
