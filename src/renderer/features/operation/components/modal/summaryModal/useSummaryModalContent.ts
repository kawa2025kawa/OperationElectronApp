// src/renderer/features/operation/components/modal/summaryModal/useSummaryModalContent.ts

import { createElement, useMemo } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { Column } from "@shared/types/table/tableType";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";

export function useSummaryModalContent(items: SummaryDetailRow[] = []) {
  const columns = useMemo<Column<SummaryDetailRow>[]>(
    () => [
      { key: "kanriNo", label: "管理No", width: "15%" },
      { key: "workName", label: "作業名", width: "55%" },
      {
        key: "jobId",
        label: "Job ID",
        width: "15%",
        render: (item) => item.jobId || "-",
      },
      {
        key: "status",
        label: "ステータス",
        width: "15%",
        render: (item) => createElement(StatusBadge, { status: item.status }),
      },
    ],
    [],
  );

  return {
    state: {
      items,
      columns,
      isEmpty: items.length === 0,
    },
  };
}
