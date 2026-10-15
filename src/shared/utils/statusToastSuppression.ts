// src/shared/utils/statusToastSuppression.ts

/**
 * 手動操作による成功トーストの二重表示を抑止する管理Set
 */
const suppressedSuccesses = new Set<string>();

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
