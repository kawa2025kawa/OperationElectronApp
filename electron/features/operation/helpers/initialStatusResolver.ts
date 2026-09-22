// electron/features/operation/helpers/initialStatusResolver.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import { calculateJobStatus } from "@shared/utils/dependency/statusCalculator";

/**
 * 初期ステータスの自動判定（statusCalculator に一元化）
 */
export function resolveInitialStatus(
  item: OperationItem,
  allEntitiesMap: Record<string, OperationItem>,
): JobStatus {
  // 動的ステータス（実行中・完了・エラー等）は既存の値を維持
  if (
    item.status &&
    item.status !== JOB_STATUS.SCHEDULED &&
    item.status !== JOB_STATUS.WAITING &&
    item.status !== JOB_STATUS.READY
  ) {
    return item.status;
  }

  // 🎯 一元管理された calculateJobStatus に処理をすべて委ねる
  const { status } = calculateJobStatus(item, allEntitiesMap);
  return status;
}
