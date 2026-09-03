// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import React, { useEffect } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { DataTable } from "@renderer/components/ui/table/DataTable";
import type { OperationItem } from "@shared/types/operation";
import type { Column } from "@shared/types/table";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./summaryModalContent.css";

export const SUMMARY_COLUMNS: Column<OperationItem>[] = [
  { key: "kanriNo", label: "No", width: "15%" },
  { key: "workName", label: "作業名", width: "55%" },
  { key: "jobId", label: "Job ID", width: "15%" },
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

    useEffect(() => {
      if (title && setTitle) {
        setTitle(title);
      }
    }, [title, setTitle]);

    return (
      <div className={styles.container}>
        <DataTable data={items} columns={SUMMARY_COLUMNS} rowKey="kanriNo" />
      </div>
    );
  });

SummaryModalContent.displayName = "SummaryModalContent";
