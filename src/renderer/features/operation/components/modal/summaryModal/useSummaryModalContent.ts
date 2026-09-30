import { createElement, useMemo } from "react";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type {
  OperationSummaryRow,
  TodaySummaryRow,
} from "@renderer/features/operation/services/operationSummaryService";
import type { Column } from "@shared/types/table/tableType";

export type SummaryRow = OperationSummaryRow | TodaySummaryRow;

export function useSummaryModalContent(items: SummaryRow[] = []) {
  const columns = useMemo<Column<SummaryRow>[]>(
    () => [
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
        render: (item) => ("jobId" in item && item.jobId ? item.jobId : "-"),
      },
      {
        key: "status",
        label: "ステータス",
        width: "15%",
        render: (item) =>
          createElement(StatusBadge, {
            status: item.status ?? undefined,
          }),
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
