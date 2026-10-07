// src/renderer/components/ui/statusSummary/useStatusSummary.ts

// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  filterSummaryItems,
  type OperationSummaryRow,
  type TodaySummaryRow,
} from "@renderer/features/operation/services/operationSummaryService";
import {
  selectOperationMasters,
  selectTodayIrregularMasters,
} from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import { useAppStore } from "@renderer/store";

import type { SummaryDisplayKey } from "@shared/types/statusSummary/statusSummaryTypes";

import * as styles from "./statusSummary.css";
import { getSummaryLabel, SUMMARY_DISPLAY_ORDER } from "./statusSummaryConfig";

export type SummaryRow = OperationSummaryRow | TodaySummaryRow;

export interface StatusItemData {
  key: SummaryDisplayKey;
  label: string;
  displayValue: string | number;
  badgeClass: string;
}

export interface UseStatusSummaryParams {
  openModal: (items: SummaryRow[], title: string) => void;
}

type StatusSummaryBadgeKey = keyof typeof styles.valueBadgeVariants;

const getBadgeClass = (key: SummaryDisplayKey): string => {
  return styles.valueBadgeVariants[key as StatusSummaryBadgeKey];
};

export const useStatusSummary = ({ openModal }: UseStatusSummaryParams) => {
  const {
    summary,
    operationMasters,
    todayIrregularMasters,
    operationStatuses,
    todayStatuses,
  } = useAppStore(
    useShallow((state) => ({
      summary: state.summary,
      operationMasters: selectOperationMasters(state),
      todayIrregularMasters: selectTodayIrregularMasters(state),
      operationStatuses: state.operationStatuses,
      todayStatuses: state.todayStatuses,
    })),
  );

  const items = SUMMARY_DISPLAY_ORDER.map((key) => {
    const value = summary[key] ?? 0;

    return {
      key,
      label: getSummaryLabel(key),
      displayValue: key === "progress" ? `${value}%` : value,
      badgeClass: getBadgeClass(key),
    };
  });

  const handleClick = useCallback(
    (key: SummaryDisplayKey, label: string) => {
      if (key === "progress") {
        return;
      }

      const filteredItems = filterSummaryItems(
        {
          operationMasters,
          todayIrregularMasters,
          operationStatuses,
          todayStatuses,
        },
        key,
      );

      openModal(filteredItems, label);
    },
    [
      operationMasters,
      todayIrregularMasters,
      operationStatuses,
      todayStatuses,
      openModal,
    ],
  );

  return {
    items,
    handleClick,
  };
};
