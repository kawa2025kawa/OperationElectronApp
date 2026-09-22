import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "../../types/operation/operationTypes";

/**
 * 前提ジョブの完了状態と依存定義に基づき、対象ジョブの初期/現在の状態を計算する純粋関数
 */
export function resolveInitialJobStatus(
  item: OperationItem,
  allEntitiesMap: Record<string, OperationItem>,
): JobStatus {
  // すでに完了・エラー・実行中などの動的ステータスがある場合はそれを優先
  if (
    item.status &&
    item.status !== JOB_STATUS.SCHEDULED &&
    item.status !== JOB_STATUS.READY &&
    item.status !== JOB_STATUS.WAITING
  ) {
    return item.status;
  }

  const dependsOn = item.dependency?.dependsOn;
  const dependencyList = Array.isArray(dependsOn)
    ? dependsOn
    : dependsOn
      ? [dependsOn]
      : [];

  // 依存ジョブがない場合は即座に 'ready'
  if (dependencyList.length === 0) {
    return JOB_STATUS.READY;
  }

  // 依存ジョブがすべて SUCCESS か確認
  const isAllDependenciesSatisfied = dependencyList.every((depId) => {
    const parentItem = allEntitiesMap[depId.trim()];
    return parentItem?.status === JOB_STATUS.SUCCESS;
  });

  return isAllDependenciesSatisfied ? JOB_STATUS.READY : JOB_STATUS.WAITING;
}

/**
 * 全ジョブの依存関係を一括解析し、初期ステータスがセットされたエンティティマップを返す
 */
export function resolveAllJobStatuses(
  items: OperationItem[],
): Record<string, OperationItem> {
  const map: Record<string, OperationItem> = {};
  for (const item of items) {
    if (item.kanriNo) map[String(item.kanriNo).trim()] = { ...item };
  }

  for (const kanriNo of Object.keys(map)) {
    const item = map[kanriNo];
    if (item) {
      item.status = resolveInitialJobStatus(item, map);
    }
  }

  return map;
}
