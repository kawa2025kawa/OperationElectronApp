// src/renderer/features/operation/helpers/statusEvaluator.ts

import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import { isScheduledTimePassed, isJobTimedOut } from "@shared/utils/dateUtils";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";
import { checkJobDependencies, getDependentKanriNos } from "./dependencyHelper";
import { findEntityByKanriNo, getAllEntities } from "./operationEntities";

const FINAL_STATUSES = new Set<string>([JOB_STATUS.SUCCESS, JOB_STATUS.ERROR]);

/**
 * AppState からセンターのアクティブフラグを抽出
 */
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

/**
 * 次のステータスを計算・判定
 */
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

/**
 * ステータス更新に伴う依存ジョブの連鎖的更新処理
 */
export function refreshDependentStatuses(
  state: AppState,
  changedKanriNo: string,
): void {
  const activeFlags = extractActiveFlags(state);
  const allEntities = getAllEntities(state);

  // 1. 直近でステータスが変更されたジョブを初期キューに登録
  const queue = [String(changedKanriNo)];

  // 2. 「全 jobId の完了」を依存条件に持つ特殊ジョブ (KanriNo 81等) をキューに追加
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

    // currentKanriNo 自身が最新状態か評価・更新
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

    // currentKanriNo に直接依存している後続ジョブを取得してキューにプッシュ
    const dependentKanriNos = getDependentKanriNos(currentKanriNo, allEntities);
    for (const depKanriNo of dependentKanriNos) {
      if (!processed.has(depKanriNo)) {
        queue.push(depKanriNo);
      }
    }
  }
}
