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

export function getTargetByKanriNo(kanriNo: string): OperationItem | undefined {
  return apiTargets.get(String(kanriNo));
}

export function getAllTargets(): OperationItem[] {
  return [...apiTargets.values()];
}

// ============================================================
// Clear
// ============================================================

export function clearTargets(): void {
  apiTargets.clear();
  console.log("[TargetManager] Targets cleared");
}
