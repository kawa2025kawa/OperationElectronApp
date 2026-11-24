// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import type { SummaryDisplayKey } from "@shared/types/statusSummary/statusSummaryTypes";
import { useAppStore } from "@renderer/store";

import * as styles from "./statusSummary.css";
import { getSummaryLabel, SUMMARY_DISPLAY_ORDER } from "./statusSummaryConfig";

export interface StatusSummaryItemData {
  key: SummaryDisplayKey;
  label: string;
  displayValue: string | number;
  badgeClass: string;
  isActive: boolean;
  isInteractive: boolean;
}

type StatusSummaryBadgeKey = keyof typeof styles.valueBadgeVariants;

const getBadgeClass = (key: SummaryDisplayKey): string => {
  return styles.valueBadgeVariants[key as StatusSummaryBadgeKey];
};

export const useStatusSummary = () => {
  const {
    summary,
    summaryStatusFilter,
    setSummaryStatusFilter,
    toggleSummaryStatusFilter,
  } = useAppStore(
    useShallow((state) => ({
      summary: state.summary,
      summaryStatusFilter: state.summaryStatusFilter,
      setSummaryStatusFilter: state.setSummaryStatusFilter,
      toggleSummaryStatusFilter: state.toggleSummaryStatusFilter,
    })),
  );

  const items = useMemo<StatusSummaryItemData[]>(() => {
    return SUMMARY_DISPLAY_ORDER.map((key) => {
      const value = summary[key] ?? 0;
      const isActive =
        key === "total"
          ? summaryStatusFilter !== null
          : key !== "progress" && summaryStatusFilter === key;

      return {
        key,
        label: getSummaryLabel(key),
        displayValue: key === "progress" ? `${value}%` : value,
        badgeClass: getBadgeClass(key),
        isActive,
        isInteractive: key !== "progress",
      };
    });
  }, [summary, summaryStatusFilter]);

  const handleClick = useCallback(
    (key: SummaryDisplayKey) => {
      if (key === "progress") {
        return;
      }

      if (key === "total") {
        setSummaryStatusFilter(null);
        return;
      }

      toggleSummaryStatusFilter(key);
    },
    [setSummaryStatusFilter, toggleSummaryStatusFilter],
  );

  return {
    items,
    handleClick,
  };
};
