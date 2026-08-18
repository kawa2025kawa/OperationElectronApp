// src/renderer/components/ui/toast/ToastItem.tsx

import React from "react";
import { useToastStore, type ToastData } from "./toastStore";
import * as styles from "./toast.css";

const renderIconText = (type: ToastData["type"]) => {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "!";
    case "info":
      return "i";
  }
};

const renderIconBgColor = (type: ToastData["type"]) => {
  switch (type) {
    case "success":
      return "#041e10";
    case "error":
      return "#230a0a";
    case "warning":
      return "#23190a";
    case "info":
      return "#0a1423";
  }
};

export const ToastItem: React.FC<ToastData> = React.memo(
  ({ id, message, type }) => {
    const removeToast = useToastStore((state) => state.removeToast);

    return (
      <div className={`${styles.toastBase} ${styles.toastTone[type]}`}>
        {/* 左上の丸い閉じるボタン */}
        <button
          type="button"
          className={styles.closeBadgeButton}
          onClick={() => removeToast(id)}
        >
          ✕
        </button>

        {/* アイコン */}
        <div className={styles.toastIcon}>
          <span style={{ color: renderIconBgColor(type) }}>
            {renderIconText(type)}
          </span>
        </div>

        {/* 通知テキスト */}
        <span className={styles.toastMessage}>{message}</span>
      </div>
    );
  },
);

ToastItem.displayName = "ToastItem";
