// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import { JOB_STATUS_LABEL } from "@renderer/styles/tokens/statusTheme";
import {
  JOB_STATUS,
  type JobStatus,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusSummary.css";

type SummaryDisplayStatusKey =
  | typeof JOB_STATUS.SUCCESS
  | typeof JOB_STATUS.RUNNING
  | typeof JOB_STATUS.READY
  | typeof JOB_STATUS.SCHEDULED
  | typeof JOB_STATUS.NEEDS_ACTION
  | typeof JOB_STATUS.ERROR;

export type SummaryDisplayKey = "total" | "progress" | SummaryDisplayStatusKey;

const SUMMARY_DISPLAY_ORDER = [
  "progress",
  "total",
  JOB_STATUS.SUCCESS,
  JOB_STATUS.RUNNING,
  JOB_STATUS.READY,
  JOB_STATUS.SCHEDULED,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
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

function getSummaryValue(summary: StatusSummary, key: SummaryDisplayKey): number {
  switch (key) {
    case JOB_STATUS.RUNNING:
      return (summary.running ?? 0) + (summary.scriptRunning ?? 0);
    case JOB_STATUS.SCHEDULED:
      return (summary.scheduled ?? 0) + (summary.waiting ?? 0);
    default:
      return summary[key] ?? 0;
  }
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
      const value = getSummaryValue(summary, key);
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
      toggleSummaryStatusFilter(key as JobStatus);
    },
    [setSummaryStatusFilter, toggleSummaryStatusFilter],
  );

  return {
    items,
    handleClick,
  };
};
