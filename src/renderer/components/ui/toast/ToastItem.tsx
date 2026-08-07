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

export const ToastItem: React.FC<ToastItemProps> = ({ id, message, type }) => {
  return (
    <div className={`${styles.toastBase} ${toastTone[type]}`}>
      <span className={styles.toastMessage}>{message}</span>
      <CloseButton variant="ghost" onClick={() => toast.dismiss(id)} />
    </div>
  );
};
