// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo, useCallback, type KeyboardEvent } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { clsx } from "clsx";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import { useOperationTable } from "./useOperationTable";
import {
  EMPTY_OPERATION_ROWS,
  getOperationCellDisplayValue,
  getOperationColumnAlignment,
  getOperationColumnMeta,
  getVisibleOperationColumns,
  type OperationColumn,
} from "./operationTableConfig";
import * as styles from "./operationTable.css";

// Table Row

interface TableRowProps {
  readonly row: OperationViewItem;
  readonly columns: readonly OperationColumn[];
  readonly isSelected: boolean;
  readonly kanriNo: string;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
}

const TableRowItem = memo(function TableRowItem({
  row,
  columns,
  isSelected,
  kanriNo,
  onRowClick,
  onMarkSuccess,
}: TableRowProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      onMarkSuccess(kanriNo);
    },
    [kanriNo, onMarkSuccess],
  );

  return (
    <tr
      tabIndex={0}
      className={clsx(
        styles.tableRowBase,
        isSelected
          ? styles.tableRowStates.selected
          : styles.tableRowStates.clickable,
      )}
      onClick={() => onRowClick(kanriNo)}
      onKeyDown={handleKeyDown}
    >
      {columns.map((column) => {
        const className = clsx(
          styles.tdBase,
          getOperationColumnAlignment(column),
        );

        if (column === "status") {
          return (
            <td key={column} className={className}>
              <ContextMenu.Root>
                <ContextMenu.Trigger asChild>
                  <div className={styles.statusCellWrapper}>
                    <StatusBadge status={row.status} />
                  </div>
                </ContextMenu.Trigger>
                <StatusContextMenu kanriNo={kanriNo} />
              </ContextMenu.Root>
            </td>
          );
        }

        return (
          <td key={column} className={className}>
            <span className={styles.cellText}>
              {getOperationCellDisplayValue(row, column)}
            </span>
          </td>
        );
      })}
    </tr>
  );
});

// Operation Table

export const OperationTable = memo(function OperationTable() {
  const {
    currentMode,
    rows,
    selectedId,
    containerRef,
    handleScroll,
    handleRowClick,
    handleMarkSuccess,
  } = useOperationTable();

  const columns = getVisibleOperationColumns(currentMode);
  const tableRows = rows ?? EMPTY_OPERATION_ROWS;

  return (
    <div className={styles.container}>
      <div
        ref={containerRef}
        className={styles.scrollContainer}
        onScroll={handleScroll}
      >
        <table className={styles.table}>
          <colgroup>
            {columns.map((column) => (
              <col
                key={column}
                style={{ width: getOperationColumnMeta(column).width }}
              />
            ))}
          </colgroup>

          <thead className={styles.thead}>
            <tr className={styles.headerRow}>
              {columns.map((column) => {
                const meta = getOperationColumnMeta(column);

                return (
                  <th
                    key={column}
                    className={clsx(
                      styles.thBase,
                      column === "status"
                        ? styles.alignVariants.center
                        : getOperationColumnAlignment(column),
                    )}
                  >
                    <span className={styles.cellText}>{meta.label}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className={styles.emptyCell}
                >
                  <EmptyState />
                </td>
              </tr>
            ) : (
              tableRows.map((row, index) => {
                const kanriNo = row.kanriNo.trim();

                return (
                  <TableRowItem
                    key={kanriNo || String(index)}
                    row={row}
                    columns={columns}
                    isSelected={Boolean(kanriNo) && selectedId === kanriNo}
                    kanriNo={kanriNo}
                    onRowClick={handleRowClick}
                    onMarkSuccess={handleMarkSuccess}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

OperationTable.displayName = "OperationTable";
