// src/renderer/components/ui/emptyState/EmptyState.tsx
import React from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import * as styles from "./emptyState.css";

interface EmptyStateProps {
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ className }) => {
  return (
    <div className={clsx(styles.emptyWrapper, animateFadeIn, className)}>
      <div className={styles.emptyText}>NO DATA</div>
    </div>
  );
};
