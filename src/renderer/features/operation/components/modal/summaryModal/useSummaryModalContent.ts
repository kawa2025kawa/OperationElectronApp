// src/renderer/features/operation/components/modal/summaryModal/useSummaryModalContent.ts

import { useEffect } from "react";
import type { OperationItem } from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";
import { useAppStore } from "@shared/store";

interface UseSummaryModalContentParams {
  items: OperationItem[];
  title?: string;
  setTitle?: (title: string) => void;
}

export const useSummaryModalContent = ({
  items,
  title,
  setTitle,
}: UseSummaryModalContentParams) => {
  const recalculateSummary = useAppStore((state) => state.recalculateSummary);

  // ★ タイトルが渡されていれば親(OperationModal)のタイトルを上書き設定する
  useEffect(() => {
    if (title && setTitle) {
      setTitle(title);
    }
  }, [title, setTitle]);

  useEffect(() => {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      const statusKey = String(item.status ?? "").toLowerCase();
      acc[statusKey] = (acc[statusKey] ?? 0) + 1;
      return acc;
    }, {});

    const total = items.length;
    const success = counts.success ?? 0;

    const nextSummary: StatusSummary = {
      total,
      success,
      running: counts.running ?? 0,
      scriptRunning: counts.script_running ?? counts.scriptrunning ?? 0,
      ready: counts.ready ?? 0,
      waiting: counts.waiting ?? 0,
      scheduled: counts.scheduled ?? 0,
      error: counts.error ?? 0,
      progress: total > 0 ? Math.round((success / total) * 100) : 0,
    };

    useAppStore.setState({ summary: nextSummary });

    return () => {
      recalculateSummary();
    };
  }, [items, recalculateSummary]);

  return {
    displayItems: items,
  };
};

useSummaryModalContent;
