// src/renderer/features/operation/components/table/UnifiedTableRow.tsx

import React, { useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";

import { useAppStore } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";

import * as styles from "./operationTable.css";

interface TableRowProps {
  kanriNo: string;
  columns: Column<OperationItem>[];
  isSelected: boolean;
  onRowClick: (kanriNo: string) => void;
}

export const UnifiedTableRow: React.FC<TableRowProps> = React.memo(
  ({ kanriNo, columns, isSelected, onRowClick }) => {
    const item = useAppStore(
      (state) =>
        (state.operationEntities[kanriNo] ??
          state.irregularEntities[kanriNo]) as OperationItem | undefined,
    );

    const handleClick = useCallback(() => {
      onRowClick(kanriNo);
    }, [kanriNo, onRowClick]);

    if (!item) {
      return null;
    }

    const rowClass = [
      styles.tableRowBase,
      isSelected
        ? styles.tableRowStates.selected
        : styles.tableRowStates.clickable,
    ].join(" ");

    return (
      <tr className={rowClass} onClick={handleClick}>
        {columns.map((column) => {
          const alignClass = styles.tdAlignVariants[column.align ?? "left"];

          if (column.key === "status") {
            return (
              <td key="status" className={`${styles.tdBase} ${alignClass}`}>
                <ContextMenu.Root>
                  <ContextMenu.Trigger asChild>
                    <div className={styles.statusCellWrapper}>
                      <StatusBadge status={item.status ?? undefined} />
                    </div>
                  </ContextMenu.Trigger>

                  <StatusContextMenu kanriNo={item.kanriNo} />
                </ContextMenu.Root>
              </td>
            );
          }

          const value = item[column.key as keyof OperationItem];

          return (
            <td
              key={String(column.key)}
              className={`${styles.tdBase} ${alignClass}`}
            >
              <span className={styles.cellText}>
                {value != null ? String(value) : "-"}
              </span>
            </td>
          );
        })}
      </tr>
    );
  },
  (prev, next) =>
    prev.kanriNo === next.kanriNo &&
    prev.isSelected === next.isSelected &&
    prev.columns === next.columns &&
    prev.onRowClick === next.onRowClick,
);

UnifiedTableRow.displayName = "UnifiedTableRow";

UnifiedTableRow;
