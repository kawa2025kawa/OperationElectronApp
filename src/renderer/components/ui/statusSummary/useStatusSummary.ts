// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import type {
  SummaryDetailRow,
  SummaryDisplayKey,
} from "@shared/types/statusSummary/statusSummaryTypes";
import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { isRunningStatus } from "@shared/utils/statusUtils";
import { useAppStore } from "@renderer/store";
import { operationService } from "@renderer/features/operation/service/operationService";

import * as styles from "./statusSummary.css";
import { getSummaryLabel, SUMMARY_DISPLAY_ORDER } from "./statusSummaryConfig";

export interface UseStatusSummaryParams {
  openModal: (items: SummaryDetailRow[], title: string) => void;
}

export interface StatusSummaryItemData {
  key: SummaryDisplayKey;
  label: string;
  displayValue: string | number;
  badgeClass: string;
}

type StatusSummaryBadgeKey = keyof typeof styles.valueBadgeVariants;

const getBadgeClass = (key: SummaryDisplayKey): string => {
  return styles.valueBadgeVariants[key as StatusSummaryBadgeKey];
};

function matchesSummaryFilter(
  filterKey: SummaryDisplayKey,
  status: JobStatus | undefined,
): boolean {
  if (filterKey === "total") {
    return true;
  }

  if (filterKey === "progress") {
    return isRunningStatus(status);
  }

  return status === filterKey;
}

function buildLocalSummaryDetails(
  filterKey: SummaryDisplayKey,
  operationRows: readonly OperationViewItem[],
  todayRows: readonly OperationViewItem[],
): SummaryDetailRow[] | null {
  if (operationRows.length === 0 && todayRows.length === 0) {
    return null;
  }

  const seen = new Set<string>();
  const results: SummaryDetailRow[] = [];

  const collect = (rows: readonly OperationViewItem[]) => {
    for (const item of rows) {
      const kanriNo = item.kanriNo?.trim();
      if (!kanriNo || seen.has(kanriNo)) {
        continue;
      }
      seen.add(kanriNo);

      if (!matchesSummaryFilter(filterKey, item.status)) {
        continue;
      }

      results.push({
        kanriNo,
        workName: item.workName?.trim() || `No.${kanriNo}`,
        status: item.status,
        comment: item.comment ?? undefined,
        ...("jobId" in item && item.jobId !== undefined
          ? { jobId: String(item.jobId).trim() }
          : {}),
      });
    }
  };

  collect(operationRows);
  collect(todayRows);

  return results;
}

export const useStatusSummary = ({ openModal }: UseStatusSummaryParams) => {
  const summary = useAppStore(useShallow((state) => state.summary));

  const items = useMemo<StatusSummaryItemData[]>(() => {
    return SUMMARY_DISPLAY_ORDER.map((key) => {
      const value = summary[key] ?? 0;

      return {
        key,
        label: getSummaryLabel(key),
        displayValue: key === "progress" ? `${value}%` : value,
        badgeClass: getBadgeClass(key),
      };
    });
  }, [summary]);

  const handleClick = useCallback(
    async (key: SummaryDisplayKey, label: string) => {
      if (key === "progress") {
        return;
      }

      const { tableRowsByMode } = useAppStore.getState();
      const localItems = buildLocalSummaryDetails(
        key,
        tableRowsByMode.operation,
        tableRowsByMode.today,
      );

      if (localItems !== null) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            openModal(localItems, label);
          });
        });
        return;
      }

      try {
        const filteredItems = await operationService.getSummaryDetails(key);
        openModal(filteredItems, label);
      } catch (error) {
        console.error(
          "[useStatusSummary] Failed to fetch summary details from backend:",
          error,
        );
      }
    },
    [openModal],
  );

  return {
    items,
    handleClick,
  };
};
