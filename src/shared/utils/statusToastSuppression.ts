// src/shared/utils/statusToastSuppression.ts

/**
 * 手動操作による成功トーストの二重表示を抑止する管理クラス
 */
class StatusToastSuppressionManager {
  private suppressedSuccesses = new Set<string>();

  /**
   * 指定した管理No.の成功トースト通知を1回分抑止対象に登録
   */
  suppressNextSuccessToast(kanriNo: string | number): void {
    const key = String(kanriNo).trim();
    if (key) {
      this.suppressedSuccesses.add(key);
    }
  }

  /**
   * 抑止対象に含まれているか確認し、含まれていればフラグを消費（削除）する
   */
  consumeSuppressedSuccessToast(kanriNo: string | number): boolean {
    const key = String(kanriNo).trim();
    if (!key) return false;

    if (this.suppressedSuccesses.has(key)) {
      this.suppressedSuccesses.delete(key);
      return true;
    }
    return false;
  }

  /**
   * 状態のリセット（テスト・再初期化用）
   */
  clear(): void {
    this.suppressedSuccesses.clear();
  }
}

export const statusToastSuppression = new StatusToastSuppressionManager();

// 後方互換性API
export const suppressNextSuccessToast = (kanriNo: string | number) =>
  statusToastSuppression.suppressNextSuccessToast(kanriNo);

export const consumeSuppressedSuccessToast = (kanriNo: string | number) =>
  statusToastSuppression.consumeSuppressedSuccessToast(kanriNo);
