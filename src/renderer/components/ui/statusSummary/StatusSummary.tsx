// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { SummaryModalContent } from "@renderer/features/operation/components/modal/summaryModal/SummaryModalContent";
import type { OperationItem } from "@shared/types/operation";
import type { StatusSummary as FilteredSummary } from "@shared/types/ui";
import { useStatusSummary } from "./useStatusSummary";
import * as styles from "./statusSummary.css";

export interface StatusSummaryProps {
  data: FilteredSummary;
}

export const StatusSummary: React.FC<StatusSummaryProps> = React.memo(
  ({ data }) => {
    const openGlobalModal = useAppStore((state) => state.openGlobalModal);

    const handleOpenModal = useCallback(
      (summaryItems: OperationItem[], titleLabel: string) => {
        // 🎯 SummaryModalContent の静的プロパティ (modalSize 等) を保持したままラッパー関数を作成
        const Content = () => <SummaryModalContent items={summaryItems} />;
        Object.assign(Content, SummaryModalContent);

        openGlobalModal(Content, {
          title: titleLabel,
        });
      },
      [openGlobalModal],
    );

    const { items, handleClick } = useStatusSummary({
      data,
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
  },
);

StatusSummary.displayName = "StatusSummary";
