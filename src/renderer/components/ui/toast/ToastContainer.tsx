import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import * as styles from "./toast.css";

export const ToastContainer: React.FC = () => {
  const [hasToasts, setHasToasts] = useState(false);

  useEffect(() => {
    // DOMの変化を監視してトーストの有無をアトミックに検知
    const checkToasts = () => {
      const exists =
        document.querySelectorAll("[data-sonner-toast]").length > 0;
      setHasToasts((prev) => (prev !== exists ? exists : prev));
    };

    // 初期チェック
    checkToasts();

    // DOM変更の監視（タイマーを使わないためパフォーマンス最高）
    const observer = new MutationObserver(() => {
      checkToasts();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  if (!hasToasts) return null;

  return (
    <div className={styles.notificationPanelWrapper}>
      <div className={styles.headerWrapper}>
        <div className={styles.panelHeader}>System Notifications</div>
        <CloseButton
          variant="ghost"
          onClick={() => {
            toast.dismiss();
            setHasToasts(false);
          }}
          title="すべて閉じる"
        />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "transparent",
            border: "none",
            boxShadow: "none",
            padding: 0,
            width: "100%",
          },
        }}
      />
    </div>
  );
};

export default ToastContainer;
