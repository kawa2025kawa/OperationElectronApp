// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { SummaryModalContent } from "@renderer/features/operation/components/modal/summaryModal/SummaryModalContent";
import { DEFAULT_MODAL_SIZE } from "@renderer/features/operation/helpers/operationEntities";
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
        // 🎯【修正】コンポーネントを生成する無名関数（または React.createElement）を渡す
        const Content = () => <SummaryModalContent items={summaryItems} />;
        Object.assign(Content, SummaryModalContent);

        openGlobalModal(Content, {
          title: titleLabel,
          ...DEFAULT_MODAL_SIZE,
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
