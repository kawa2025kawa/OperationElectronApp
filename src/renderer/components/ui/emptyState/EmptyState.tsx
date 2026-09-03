import React from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import * as styles from "./emptyState.css";

interface EmptyStateProps {
  className?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  message,
  onRetry,
  retryText = "再試行",
}) => {
  return (
    <div className={clsx(styles.emptyWrapper, animateFadeIn, className)}>
      {message ? (
        <div className={styles.messageText}>{message}</div>
      ) : (
        <div className={styles.emptyText}>NO DATA</div>
      )}

      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retryButton}>
          {retryText}
        </button>
      )}
    </div>
  );
};
