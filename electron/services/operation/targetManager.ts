// electron/services/operation/targetManager.ts

import type { OperationItem } from "@shared/types/operationType";

/**
 * Tracker API監視対象
 *
 * Tauri:
 * AppSyncState.api_targets
 */
const apiTargets = new Map<string, OperationItem>();

/**
 * 監視対象登録
 *
 * register_targets()
 */
export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();

  for (const item of items) {
    if (!item.kanriNo) {
      continue;
    }

    apiTargets.set(item.kanriNo, item);
  }

  console.log("[TargetManager] registered", {
    count: apiTargets.size,
  });
}

/**
 * 管理No検索
 *
 * kanriNo
 * ↓
 * OperationItem
 */
export function getTargetByKanriNo(kanriNo: string): OperationItem | undefined {
  return apiTargets.get(kanriNo);
}

/**
 * 全監視対象取得
 */
export function getAllTargets(): OperationItem[] {
  return [...apiTargets.values()];
}

/**
 * 登録解除
 */
export function clearTargets(): void {
  apiTargets.clear();

  console.log("[TargetManager] cleared");
}
