import React from "react";
import { toast } from "sonner";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import * as styles from "./toast.css";
import { toastTone } from "./toastTone.css";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItemProps {
  id: string | number;
  message: string;
  type: ToastType;
}

const renderIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return <span style={{ color: "var(--color-success, #22c55e)" }}>✓</span>;
    case "error":
      return <span style={{ color: "var(--color-error, #ef4444)" }}>✕</span>;
    case "warning":
      return <span style={{ color: "var(--color-warning, #f59e0b)" }}>⚠</span>;
    case "info":
      return <span style={{ color: "var(--color-info, #3b82f6)" }}>ℹ</span>;
  }
};

export const ToastItem: React.FC<ToastItemProps> = ({ id, message, type }) => {
  return (
    <div className={`${styles.toastBase} ${toastTone[type]}`}>
      <div className={styles.toastIcon}>{renderIcon(type)}</div>
      <span className={styles.toastMessage}>{message}</span>
      <CloseButton variant="ghost" onClick={() => toast.dismiss(id)} />
    </div>
  );
};
