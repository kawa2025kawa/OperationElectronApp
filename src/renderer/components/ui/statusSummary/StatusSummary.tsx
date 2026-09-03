// src/renderer/components/ui/statusSummary/StatusSummary.tsx

import React, { useCallback } from "react";
import clsx from "clsx";
import { useAppStore } from "@renderer/store";
import type { OperationItem } from "@shared/types/operation";
import { OperationModal } from "@renderer/features/operation/components/modal/OperationModal";
import { useStatusSummary, type StatusSummaryProps } from "./useStatusSummary";
import * as styles from "./statusSummary.css";

const SUMMARY_MODAL_SIZE = {
  width: 800,
  height: 600,
} as const;

export const StatusSummary: React.FC<StatusSummaryProps> = React.memo(
  ({ data }) => {
    const openGlobalModal = useAppStore((state) => state.openGlobalModal);
    const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);

    const handleOpenModal = useCallback(
      (items: OperationItem[], title: string) => {
        openGlobalModal(
          <OperationModal
            type="summary"
            items={items}
            onClose={closeGlobalModal}
          />,
          {
            title,
            width: String(SUMMARY_MODAL_SIZE.width),
            height: String(SUMMARY_MODAL_SIZE.height),
          },
        );
      },
      [closeGlobalModal, openGlobalModal],
    );

    const { items, handleClick } = useStatusSummary({
      data,
      openModal: handleOpenModal,
    });

    return (
      <nav className={styles.container}>
        {items.map(({ key, label, displayValue, badgeClass }) => (
          <button
            key={key}
            type="button"
            className={styles.statusItem}
            onClick={() => handleClick(key, label)}
          >
            <span className={clsx(styles.valueBadge, badgeClass)}>
              {displayValue}
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </nav>
    );
  },
);

StatusSummary.displayName = "StatusSummary";

StatusSummary;
