// src/renderer/components/ui/statusSummary/useStatusSummary.ts

import { useCallback } from "react";
import { useShallow } from "zustand/shallow";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";
import { useAppStore } from "@renderer/store";
import type { SummaryDisplayKey } from "@shared/types/statusSummary/statusSummaryTypes";

import * as styles from "./statusSummary.css";
import { getSummaryLabel, SUMMARY_DISPLAY_ORDER } from "./statusSummaryConfig";

export interface UseStatusSummaryParams {
  openModal: (items: any[], title: string) => void;
}

type StatusSummaryBadgeKey = keyof typeof styles.valueBadgeVariants;

const getBadgeClass = (key: SummaryDisplayKey): string => {
  return styles.valueBadgeVariants[key as StatusSummaryBadgeKey];
};

export const useStatusSummary = ({ openModal }: UseStatusSummaryParams) => {
  const summary = useAppStore(useShallow((state) => state.summary));

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
    async (key: SummaryDisplayKey, label: string) => {
      if (key === "progress") {
        return;
      }

      try {
        const filteredItems = (await window.electronAPI.invoke(
          IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS,
          { filterKey: key },
        )) as SummaryDetailRow[];

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
