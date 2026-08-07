//src\renderer\components\ui\button\modalFooter\ModalFooter.tsx

import React from "react";
import * as styles from "./modalFooter.css"; // 独立したスタイルをインポート

export interface ModalFooterProps {
  onClose: () => void;
  onPrimary: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  isExecuting?: boolean;
  primaryDisabled?: boolean;
}

export const ModalFooter: React.FC<ModalFooterProps> = React.memo(
  ({
    onClose,
    onPrimary,
    primaryLabel = "実行",
    secondaryLabel = "キャンセル",
    isExecuting = false,
    primaryDisabled = false,
  }) => (
    <div className={styles.buttonGroup}>
      {secondaryLabel && (
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onClose}
          disabled={isExecuting}
        >
          {secondaryLabel}
        </button>
      )}
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onPrimary}
        disabled={isExecuting || primaryDisabled}
      >
        {isExecuting ? "実行中..." : primaryLabel}
      </button>
    </div>
  ),
);

ModalFooter.displayName = "ModalFooter";
