// src/renderer/components/ui/toast/PollingToast.tsx

import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";

import * as styles from "./pollingToast.css";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export const PollingToast = memo(() => {
  const { toasts, removeToast, clearAllToasts } = usePollingToastStore(
    useShallow((state) => ({
      toasts: state.toasts,
      removeToast: state.removeToast,
      clearAllToasts: state.clearAllToasts,
    })),
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section className={styles.panel} aria-label="System Notifications">
      <header className={styles.header}>
        <span className={styles.title}>System Notifications</span>

        <CloseButton
          variant="ghost"
          onClick={clearAllToasts}
          title="すべて閉じる"
        />
      </header>

      <div className={styles.list}>
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={`${styles.item} ${styles.tone[toast.type]}`}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => removeToast(toast.id)}
              aria-label="通知を閉じる"
            >
              ✕
            </button>

            <span className={styles.icon} aria-hidden="true">
              {ICONS[toast.type]}
            </span>

            <span className={styles.message}>{toast.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
});
