import React, { useMemo } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { OperationItem } from "@shared/types/operation";
import type { Column } from "@shared/types/table/tableType";

export function useSummaryModalContent(items: OperationItem[] = []) {
  // サマリー用カラム定義のメモ化
  const columns = useMemo<Column<OperationItem>[]>(
    () => [
      { key: "kanriNo", label: "No", width: "15%" },
      { key: "workName", label: "作業名", width: "55%" },
      { key: "jobId", label: "Job ID", width: "15%" },
      {
        key: "status",
        label: "ステータス",
        width: "15%",
        render: (item) =>
          React.createElement(StatusBadge, {
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
