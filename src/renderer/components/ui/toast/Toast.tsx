// src/renderer/components/ui/toast/Toast.tsx

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";

import { useToastStore, type ToastType } from "./toastStore";
import * as styles from "./toast.css";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export const Toast = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearAllToasts = useToastStore((state) => state.clearAllToasts);

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
        {toasts.map(({ id, message, type }) => (
          <article key={id} className={`${styles.item} ${styles.tone[type]}`}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => removeToast(id)}
              aria-label="通知を閉じる"
            >
              ✕
            </button>

            <span className={styles.icon} aria-hidden="true">
              {ICONS[type]}
            </span>

            <span className={styles.message}>{message}</span>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Toast;
