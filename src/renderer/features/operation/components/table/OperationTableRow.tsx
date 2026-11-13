// src/renderer/features/operation/components/table/OperationTableRow.tsx

import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { useTable, type Row } from "@tanstack/react-table";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { useAppStore } from "@renderer/store";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import type {
  OperationColumn,
  OperationColumnMeta,
  TableFeaturesType,
} from "./operationTableConfig";

import * as styles from "./operationTable.css";

interface OperationTableRowProps {
  readonly row: Row<TableFeaturesType, OperationViewItem>;
  readonly table: ReturnType<
    typeof useTable<TableFeaturesType, OperationViewItem>
  >;
  readonly isContextOpen: boolean;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
  readonly onStatusContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    item: OperationViewItem,
  ) => void;
}

export const OperationTableRow = memo(function OperationTableRow({
  row,
  table,
  isContextOpen,
  onRowClick,
  onMarkSuccess,
  onStatusContextMenu,
}: OperationTableRowProps) {
  const kanriNo = row.original.kanriNo.trim();
  const isSelected = useAppStore(
    (state) =>
      Boolean(kanriNo) && state.selectedIds[state.currentMode] === kanriNo,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    onMarkSuccess(kanriNo);
  };

  return (
    <tr
      tabIndex={0}
      data-context-open={isContextOpen}
      className={`${styles.tableRowBase} ${
        isSelected
          ? styles.tableRowStates.selected
          : styles.tableRowStates.clickable
      }`}
      onClick={() => onRowClick(kanriNo)}
      onKeyDown={handleKeyDown}
    >
      {row.getAllCells().map((cell) => {
        const column = cell.column.id as OperationColumn;
        const meta = cell.column.columnDef.meta as
          | OperationColumnMeta
          | undefined;
        const align = meta?.align ?? "left";

        return (
          <td
            key={cell.id}
            className={`${styles.tdBase} ${styles.alignVariants[align]}`}
          >
            {column === "status" ? (
              <div className={styles.statusCellWrapper}>
                <div
                  className={styles.statusBadgeAnchor}
                  data-context-open={isContextOpen}
                  onContextMenu={(event) =>
                    onStatusContextMenu(event, row.original)
                  }
                >
                  <StatusBadge status={row.original.status} />
                </div>
              </div>
            ) : (
              <span className={styles.cellText}>
                <table.FlexRender cell={cell} />
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
});

OperationTableRow.displayName = "OperationTableRow";
