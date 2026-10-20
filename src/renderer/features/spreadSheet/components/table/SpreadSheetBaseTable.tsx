// src/renderer/features/spreadsheet/components/table/SpreadSheetBaseTable.tsx

import { memo, useCallback } from "react";
import type { Column } from "@shared/types/table/tableType";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";

export interface SpreadSheetTableStyles {
  container: string;
  headerWrapper: string;
  headerTable: string;
  thBase: string;
  alignVariants: Record<string, string>;
  bodyWrapper: string;
  bodyTable: string;
  tableRowBase: string;
  tableRowStates: {
    selected: string;
    clickable: string;
    idle: string;
  };
  tdBase: string;
  cellText: string;
}

export interface SpreadSheetBaseTableProps<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  selectedId?: string;
  getRowId?: (row: T, index: number) => string;
  onRowClick?: (item: T) => void;
  renderCell?: (row: T, col: Column<T>, value: unknown) => React.ReactNode;
  styles: SpreadSheetTableStyles;
}

interface TableRowProps<T> {
  row: T;
  columns: readonly Column<T>[];
  isSelected: boolean;
  onRowClick?: (item: T) => void;
  renderCell?: (row: T, col: Column<T>, value: unknown) => React.ReactNode;
  styles: SpreadSheetTableStyles;
}

function SpreadSheetBaseTableRowInner<T>({
  row,
  columns,
  isSelected,
  onRowClick,
  renderCell,
  styles,
}: TableRowProps<T>) {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      onClick={handleClick}
    >
      {columns.map((col) => {
        const value = (row as Record<string, unknown>)[col.key as string];
        const alignClass =
          styles.alignVariants[col.align ?? "left"] ??
          styles.alignVariants.left;

        return (
          <td
            key={String(col.key)}
            className={`${styles.tdBase} ${alignClass}`}
          >
            {renderCell ? (
              renderCell(row, col, value)
            ) : (
              <span className={styles.cellText}>
                {value == null || value === "" ? "-" : String(value)}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

const SpreadSheetBaseTableRow = memo(
  SpreadSheetBaseTableRowInner,
) as typeof SpreadSheetBaseTableRowInner;

export function SpreadSheetBaseTable<T>({
  rows,
  columns,
  selectedId,
  getRowId,
  onRowClick,
  renderCell,
  styles,
}: SpreadSheetBaseTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          <colgroup>
            {columns.map((col) => (
              <col key={String(col.key)} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => {
                const alignClass =
                  styles.alignVariants[col.align ?? "left"] ??
                  styles.alignVariants.left;

                return (
                  <th
                    key={String(col.key)}
                    className={`${styles.thBase} ${alignClass}`}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      <div className={styles.bodyWrapper}>
        <table className={styles.bodyTable}>
          <colgroup>
            {columns.map((col) => (
              <col key={String(col.key)} style={{ width: col.width }} />
            ))}
          </colgroup>
          <tbody>
            {rows.map((row, index) => {
              const idKey = getRowId ? getRowId(row, index) : String(index);
              const isSelected = selectedId === idKey;

              return (
                <SpreadSheetBaseTableRow
                  key={`${idKey}-${index}`}
                  row={row}
                  columns={columns}
                  isSelected={isSelected}
                  onRowClick={onRowClick}
                  renderCell={renderCell}
                  styles={styles}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
