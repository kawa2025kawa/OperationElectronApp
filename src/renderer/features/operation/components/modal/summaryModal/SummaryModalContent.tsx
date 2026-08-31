// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import React, { useEffect } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import { useAppStore } from "@renderer/store";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";
import type { StatusSummary } from "@shared/types/uiType";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./summaryModalContent.css";

export const SUMMARY_COLUMNS: Column<OperationItem>[] = [
  {
    key: "kanriNo",
    label: "No",
    width: "15%",
  },
  {
    key: "workName",
    label: "作業名",
    width: "55%",
  },
  {
    key: "jobId",
    label: "Job ID",
    width: "15%",
  },
  {
    key: "status",
    label: "ステータス",
    width: "15%",
    render: (item) =>
      React.createElement(StatusBadge, { status: item.status ?? undefined }),
  },
];

interface SummaryModalContentProps {
  items: OperationItem[];
  title?: string;
}

export const SummaryModalContent: React.FC<SummaryModalContentProps> =
  React.memo(({ items, title }) => {
    const { setTitle } = useOperationModalContext();
    const recalculateSummary = useAppStore((state) => state.recalculateSummary);

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

    return (
      <div className={styles.container}>
        <DataTable data={items} columns={SUMMARY_COLUMNS} rowKey="kanriNo" />
      </div>
    );
  });

SummaryModalContent.displayName = "SummaryModalContent";
