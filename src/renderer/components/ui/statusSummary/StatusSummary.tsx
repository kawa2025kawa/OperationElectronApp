// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import { memo, useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { SummaryModalContent } from "@renderer/features/operation/components/modal/summaryModal/SummaryModalContent";
import type {
  OperationSummaryRow,
  TodaySummaryRow,
} from "@renderer/features/operation/services/operationSummaryService";
import { useStatusSummary } from "./useStatusSummary";
import * as styles from "./statusSummary.css";

export const StatusSummary = memo(() => {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenModal = useCallback(
    (
      summaryItems: Array<OperationSummaryRow | TodaySummaryRow>,
      titleLabel: string,
    ) => {
      const Content = () => <SummaryModalContent items={summaryItems} />;
      Object.assign(Content, SummaryModalContent);

      openGlobalModal(Content, {
        title: titleLabel,
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
        <button
          key={item.key}
          type="button"
          className={styles.statusItem}
          onClick={() => handleClick(item.key, item.label)}
        >
          <span className={`${styles.valueBadge} ${item.badgeClass}`}>
            {item.displayValue}
          </span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
});
