// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import { memo, useCallback } from "react";
import { clsx } from "clsx";

import type { SummaryDisplayKey } from "@shared/types/operation/operationTypes";

import {
  useStatusSummary,
  type StatusSummaryItemData,
} from "./useStatusSummary";
import * as styles from "./statusSummary.css";

interface StatusSummaryButtonProps {
  readonly item: StatusSummaryItemData;
  readonly onClick: (key: SummaryDisplayKey) => void;
}

const StatusSummaryButton = memo(function StatusSummaryButton({
  item,
  onClick,
}: StatusSummaryButtonProps) {
  const handleButtonClick = useCallback(() => {
    onClick(item.key);
  }, [onClick, item.key]);

  const isStatusFilterActive =
    item.key !== "total" && item.key !== "progress" && item.isActive;

  return (
    <button
      type="button"
      className={clsx(
        styles.statusItem,
        !item.isInteractive && styles.statusItemProgress,
        isStatusFilterActive && styles.statusItemActive,
      )}
      aria-pressed={item.isInteractive ? isStatusFilterActive : undefined}
      onClick={handleButtonClick}
    >
      <span className={clsx(styles.valueBadge, item.badgeClass)}>
        {item.displayValue}
      </span>
      <span className={styles.label}>{item.label}</span>
    </button>
  );
});

StatusSummaryButton.displayName = "StatusSummaryButton";

export const StatusSummary = memo(function StatusSummary() {
  const { items, handleClick } = useStatusSummary();

  return (
    <div className={styles.container}>
      {items.map((item) => (
        <StatusSummaryButton key={item.key} item={item} onClick={handleClick} />
      ))}
    </div>
  );
});

StatusSummary.displayName = "StatusSummary";
