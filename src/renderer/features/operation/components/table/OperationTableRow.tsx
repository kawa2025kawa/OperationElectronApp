// src/renderer/features/operation/components/table/OperationTableRow.tsx

import { memo, useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { useTable, type Row } from "@tanstack/react-table";
import { clsx } from "clsx";

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

  const handleClick = useCallback(() => {
    onRowClick(kanriNo);
  }, [onRowClick, kanriNo]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      onMarkSuccess(kanriNo);
    },
    [onMarkSuccess, kanriNo],
  );

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onStatusContextMenu(event, row.original);
    },
    [onStatusContextMenu, row.original],
  );

  return (
    <tr
      tabIndex={0}
      data-context-open={isContextOpen}
      className={clsx(
        styles.tableRowBase,
        isSelected
          ? styles.tableRowStates.selected
          : styles.tableRowStates.clickable,
      )}
      onClick={handleClick}
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
            className={clsx(styles.tdBase, styles.alignVariants[align])}
          >
            {column === "status" ? (
              <div className={styles.statusCellWrapper}>
                <div
                  className={styles.statusBadgeAnchor}
                  data-context-open={isContextOpen}
                  onContextMenu={handleContextMenu}
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
