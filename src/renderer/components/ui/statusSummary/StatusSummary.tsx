// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import { memo, useCallback } from "react";

import { SummaryModalContent } from "@renderer/features/operation/components/modal/summaryModal/SummaryModalContent";
import { useAppStore } from "@renderer/store";
import type {
  SummaryDetailRow,
  SummaryDisplayKey,
} from "@shared/types/statusSummary/statusSummaryTypes";

import {
  useStatusSummary,
  type StatusSummaryItemData,
} from "./useStatusSummary";
import * as styles from "./statusSummary.css";

interface StatusSummaryButtonProps {
  readonly item: StatusSummaryItemData;
  readonly onClick: (key: SummaryDisplayKey, label: string) => void;
}

const StatusSummaryButton = memo(function StatusSummaryButton({
  item,
  onClick,
}: StatusSummaryButtonProps) {
  return (
    <button
      type="button"
      className={styles.statusItem}
      onClick={() => onClick(item.key, item.label)}
    >
      <span className={`${styles.valueBadge} ${item.badgeClass}`}>
        {item.displayValue}
      </span>
      <span className={styles.label}>{item.label}</span>
    </button>
  );
});

StatusSummaryButton.displayName = "StatusSummaryButton";

export const StatusSummary = memo(function StatusSummary() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenModal = useCallback(
    (summaryItems: SummaryDetailRow[], titleLabel: string) => {
      openGlobalModal(<SummaryModalContent items={summaryItems} />, {
        title: titleLabel,
        width: "min(90vw, 1000px)",
        height: "min(75vh, 600px)",
      });
    },
    [openGlobalModal],
  );

  const { items, handleClick } = useStatusSummary({
    openModal: handleOpenModal,
  });

  return (
    <div className={styles.container}>
      {items.map((item) => (
        <StatusSummaryButton key={item.key} item={item} onClick={handleClick} />
      ))}
    </div>
  );
});

StatusSummary.displayName = "StatusSummary";
