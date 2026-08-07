// src/renderer/components/ui/statusSummary/StatusSummary.tsx
import React from "react";
import clsx from "clsx";
import {
  STATUS_LABEL,
  type StatusSummary as FilteredSummary,
  type SummaryDisplayKey,
} from "@shared/types/uiType";
import * as styles from "./statusSummary.css";

const SUMMARY_ORDER: readonly SummaryDisplayKey[] = [
  "PROGRESS",
  "TOTAL",
  "success",
  "running",
  "waiting",
  "scheduled",
  "ready",
  "error",
];

interface Props {
  data: FilteredSummary;
  onItemClick?: (key: SummaryDisplayKey) => void;
}

const StatusSummaryComponent: React.FC<Props> = ({ data, onItemClick }) => {
  return (
    <nav className={styles.container}>
      {SUMMARY_ORDER.map((key) => {
        const cssVariantKey =
          key.toUpperCase() as keyof typeof styles.valueBadgeVariants;
        const badgeClass = styles.valueBadgeVariants[cssVariantKey] ?? {};
        const dataKey = key.toUpperCase() as keyof FilteredSummary;
        const rawValue = data[dataKey];
        const displayValue = key === "PROGRESS" ? `${rawValue}%` : rawValue;

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
};

export const StatusSummary = React.memo(StatusSummaryComponent);
export default StatusSummary;
