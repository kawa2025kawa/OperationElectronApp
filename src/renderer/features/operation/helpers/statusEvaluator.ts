//src\renderer\features\operation\helpers\statusEvaluator.ts

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
 * 評価時に利用するアクティブフラグを抽出するヘルパー
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

export function calculateNextStatus(
  entity: OperationItem,
  externalStatus: JobStatus | undefined,
  allEntities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): JobStatus {
  // 外部から確定状態・実行中状態が渡された場合は優先反映
  if (
    externalStatus === JOB_STATUS.SUCCESS ||
    externalStatus === JOB_STATUS.ERROR ||
    externalStatus === JOB_STATUS.RUNNING
  ) {
    return externalStatus;
  }

  // 既に最終状態（SUCCESS / ERROR）なら維持
  if (entity.status && FINAL_STATUSES.has(entity.status)) {
    return entity.status;
  }

  // 実行中状態のタイムアウトチェック
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

  // 依存関係が存在する場合はチェックを実行
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

  // 依存関係がない、または全ての依存をクリアしている場合は時刻判定で READY / SCHEDULED を決定
  return isScheduledTimePassed(entity.scheduledTime)
    ? JOB_STATUS.READY
    : JOB_STATUS.SCHEDULED;
}

export function refreshDependentStatuses(
  state: AppState,
  changedKanriNo: string,
): void {
  const queue = [String(changedKanriNo)];
  const processed = new Set<string>();
  const activeFlags = extractActiveFlags(state);
  const allEntities = getAllEntities(state);

  while (queue.length > 0) {
    const currentKanriNo = queue.shift();
    if (!currentKanriNo || processed.has(currentKanriNo)) continue;
    processed.add(currentKanriNo);

    // 変更された kanriNo に依存している後続ジョブ番号のリストを取得
    const dependentKanriNos = getDependentKanriNos(currentKanriNo, allEntities);

    for (const depKanriNo of dependentKanriNos) {
      const depEntity = findEntityByKanriNo(state, depKanriNo);
      if (!depEntity) continue;

      const nextStatus = calculateNextStatus(
        depEntity,
        undefined,
        allEntities,
        activeFlags,
      );

      if (depEntity.status !== nextStatus) {
        depEntity.status = nextStatus;
        void commands.updateJobStatus(
          depKanriNo,
          nextStatus,
          depEntity.comment ?? "",
        );
        queue.push(depKanriNo);
      }
    }
  }
}
