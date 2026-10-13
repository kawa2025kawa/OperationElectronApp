// src/shared/utils/statusToastSuppression.ts

/**
 * 手動操作による成功トーストの二重表示を抑止する管理Set
 */
const suppressedSuccesses = new Set<string>();

/**
 * 指定した管理No.の成功トースト通知を1回分抑止対象に登録
 */
export function suppressNextSuccessToast(kanriNo: string | number): void {
  const key = String(kanriNo).trim();
  if (key) {
    suppressedSuccesses.add(key);
  }
}

/**
 * 抑止対象に含まれているか確認し、含まれていればフラグを消費（削除）する
 */
export function consumeSuppressedSuccessToast(
  kanriNo: string | number,
): boolean {
  const key = String(kanriNo).trim();
  if (!key) return false;

  return suppressedSuccesses.delete(key);
}

/**
 * 抑止状態のリセット（テスト・再初期化用）
 */
export function clearSuppressedSuccessToasts(): void {
  suppressedSuccesses.clear();
}
