// src/renderer/components/ui/emptyState/EmptyState.tsx

import { clsx } from "clsx";
import { motion } from "motion/react";
import * as styles from "./emptyState.css";

interface EmptyStateProps {
  className?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const EmptyState = ({
  className,
  message,
  onRetry,
  retryText = "再試行",
}: EmptyStateProps) => {
  return (
    <motion.div
      className={clsx(styles.emptyWrapper, className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
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
    </motion.div>
  );
};
