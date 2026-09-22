// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback, useMemo } from "react";
import { useAppStore } from "@renderer/store";
import {
  STATUS_LABEL,
  SummaryOrder,
  type OperationItem,
  type StatusSummary as FilteredSummary,
  type SummaryDisplayKey,
} from "@shared/types/operation/operationTypes";
import * as styles from "./statusSummary.css";

// ============================================================
// Types
// ============================================================

export interface StatusItemData {
  key: SummaryDisplayKey;
  label: string;
  displayValue: string | number;
  badgeClass: string;
}

export interface UseStatusSummaryParams {
  data: FilteredSummary;
  openModal: (items: OperationItem[], title: string) => void;
}

// ============================================================
// Hook
// ============================================================

export const useStatusSummary = ({
  data,
  openModal,
}: UseStatusSummaryParams) => {
  const getFilteredSummaryItems = useAppStore(
    (state) => state.getFilteredSummaryItems,
  );

  const items = useMemo<StatusItemData[]>(() => {
    // 🎯 SummaryOrder.ORDER 配列を参照してループを回す
    return SummaryOrder.ORDER.map((key: SummaryDisplayKey) => {
      const rawValue = data[key] ?? 0;
      const displayValue = key === "progress" ? `${rawValue}%` : rawValue;
      const label = STATUS_LABEL[key];
      const badgeClass =
        styles.valueBadgeVariants[
          key as keyof typeof styles.valueBadgeVariants
        ];

      return {
        key,
        label,
        displayValue,
        badgeClass,
      };
    });
  }, [data]);

  const handleClick = useCallback(
    (key: SummaryDisplayKey, label: string) => {
      // 進捗率(progress)の場合はモーダルを開かない安全制御
      if (key === "progress") {
        return;
      }

      const filteredItems = getFilteredSummaryItems(key);
      openModal(filteredItems, label);
    },
    [getFilteredSummaryItems, openModal],
  );

  return {
    items,
    handleClick,
  };
};
