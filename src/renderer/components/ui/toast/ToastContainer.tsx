// src/renderer/components/ui/toast/ToastContainer.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { useToastStore } from "./toastStore";
import { ToastItem } from "./ToastItem";
import * as styles from "./toast.css";

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const clearAllToasts = useToastStore((state) => state.clearAllToasts);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.notificationPanelWrapper}>
      <div className={styles.headerWrapper}>
        <div className={styles.panelHeader}>System Notifications</div>
        <CloseButton
          variant="ghost"
          onClick={clearAllToasts}
          title="すべて閉じる"
        />
      </div>

      <div className={styles.toastList}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
