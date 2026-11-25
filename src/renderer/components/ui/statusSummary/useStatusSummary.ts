// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_VALUES,
} from "@shared/types/operation/operationTypes";
import type { SummaryDisplayKey } from "@shared/types/operation/operationTypes";

import * as styles from "./statusSummary.css";

const SUMMARY_DISPLAY_ORDER = [
  "progress",
  "total",
  ...JOB_STATUS_VALUES,
] as const satisfies readonly SummaryDisplayKey[];

const SUMMARY_LABEL: Record<"total" | "progress", string> = {
  total: "対象件数",
  progress: "進捗率",
};

function getSummaryLabel(key: SummaryDisplayKey): string {
  return key === "total" || key === "progress"
    ? SUMMARY_LABEL[key]
    : JOB_STATUS_LABEL[key];
}

export interface StatusSummaryItemData {
  key: SummaryDisplayKey;
  label: string;
  displayValue: string | number;
  badgeClass: string;
  isActive: boolean;
  isInteractive: boolean;
}

type StatusSummaryBadgeKey = keyof typeof styles.valueBadgeVariants;

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
        badgeClass: styles.valueBadgeVariants[key as StatusSummaryBadgeKey],
        isActive,
        isInteractive: key !== "progress",
      };
    });
  }, [summary, summaryStatusFilter]);

  const handleClick = useCallback(
    (key: SummaryDisplayKey) => {
      if (key === "progress") return;
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
