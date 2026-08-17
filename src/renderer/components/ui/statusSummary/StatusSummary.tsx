// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import React from "react";
import clsx from "clsx";
import {
  STATUS_LABEL,
  SUMMARY_ORDER,
  type StatusSummary as FilteredSummary,
  type SummaryDisplayKey,
} from "@shared/types/uiType";
import * as styles from "./statusSummary.css";

interface Props {
  data: FilteredSummary;
  onItemClick?: (key: SummaryDisplayKey) => void;
}

export const StatusSummary: React.FC<Props> = React.memo(
  ({ data, onItemClick }) => {
    return (
      <nav className={styles.container}>
        {SUMMARY_ORDER.map((key) => {
          const rawValue = data[key] ?? 0;
          const displayValue = key === "progress" ? `${rawValue}%` : rawValue;
          const badgeClass =
            styles.valueBadgeVariants[
              key as keyof typeof styles.valueBadgeVariants
            ];

          return (
            <button
              key={key}
              type="button"
              className={styles.statusItem}
              onClick={() => onItemClick?.(key)}
            >
              <span className={clsx(styles.valueBadge, badgeClass)}>
                {displayValue}
              </span>
              <span className={styles.label}>{STATUS_LABEL[key]}</span>
            </button>
          );
        })}
      </nav>
    );
  },
);

export default StatusSummary;
