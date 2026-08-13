// electron/services/operation/targetManager.ts

import type { OperationItem } from "@shared/types/operationType";

// ============================================================
// State
// ============================================================

const apiTargets = new Map<string, OperationItem>();

// ============================================================
// Registration
// ============================================================

/**
 * Tracker APIの監視対象を登録する。
 *
 * 登録時点の対象一覧で置き換えるため、
 * 既存の監視対象はすべてクリアしてから登録する。
 */
export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();

  for (const item of items) {
    const kanriNo = String(item.kanriNo);

    if (!kanriNo) {
      continue;
    }

    apiTargets.set(kanriNo, item);
  }

  console.log("[TargetManager] Targets registered:", {
    count: apiTargets.size,
  });
}

// ============================================================
// Read
// ============================================================

/**
 * 管理Noから監視対象を取得する。
 */
export function getTargetByKanriNo(kanriNo: string): OperationItem | undefined {
  return apiTargets.get(String(kanriNo));
}

/**
 * 現在登録されている全監視対象を取得する。
 */
export function getAllTargets(): OperationItem[] {
  return [...apiTargets.values()];
}

// ============================================================
// Clear
// ============================================================

/**
 * 監視対象をすべて解除する。
 */
export function clearTargets(): void {
  apiTargets.clear();

  console.log("[TargetManager] Targets cleared");
}
