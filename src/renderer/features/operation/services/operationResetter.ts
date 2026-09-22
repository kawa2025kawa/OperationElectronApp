import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import {
  getActiveStatusEntitiesMap,
} from "@renderer/features/operation/helpers/operationEntities";

/**
 * 単一エンティティを SCHEDULED (予定) 状態に初期化
 */
export function resetItemToScheduled(
  item: OperationItem,
): void {
  item.status = JOB_STATUS.SCHEDULED;
  item.comment = "予定";
  item.startTime = null;
  item.endTime = null;
  item.substatus = null;
  item.info = null;
}

/**
 * Status管理対象のみを SCHEDULED (予定) へ一括初期化
 *
 * 対象:
 * - OperationMasterList
 * - TodayIrregularMasterList
 *
 * 対象外:
 * - IrregularMasterList
 */
export function resetAllStatusesToScheduled(
  state: AppState,
  options: {
    preserveCompleted?: boolean;
  } = {
    preserveCompleted: false,
  },
): void {
  const activeEntities =
    getActiveStatusEntitiesMap(state);

  for (const item of Object.values(
    activeEntities,
  )) {
    if (options.preserveCompleted) {
      if (
        item.status === JOB_STATUS.SUCCESS ||
        item.status === JOB_STATUS.RUNNING ||
        item.status === JOB_STATUS.SCRIPT_RUNNING ||
        item.status === JOB_STATUS.ERROR
      ) {
        continue;
      }
    }

    resetItemToScheduled(item);
  }
}
