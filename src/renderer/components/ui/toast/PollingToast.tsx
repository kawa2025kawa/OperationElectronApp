// src/renderer/components/ui/toast/PollingToast.tsx

import { memo } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { usePollingToastStore } from "./pollingToastStore";

import * as styles from "./pollingToast.css";

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

  return createPortal(
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
            className={clsx(styles.item, styles.tone[toast.type])}
          >
            <span className={styles.message} title={toast.message}>
              {toast.message}
            </span>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => removeToast(toast.id)}
              aria-label="通知を閉じる"
            >
              ✕
            </button>
          </article>
        ))}
      </div>
    </section>,
    document.body,
  );
});

PollingToast.displayName = "PollingToast";
