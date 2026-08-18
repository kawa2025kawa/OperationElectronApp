// src/renderer/components/ui/table/DataTable.tsx

import React, { useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { clsx } from "clsx";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { Column, TableColumnMeta } from "@shared/types/tableType";
import * as styles from "./dataTable.css";

export interface DataTableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  rowKey: keyof T | ((item: T) => string | number);
  selectedId?: string | number | null | undefined;
  onRowClick?: ((item: T) => void) | undefined;
}

interface TableRowProps<T> {
  row: Row<T>;
  rowKey: keyof T | ((item: T) => string | number);
  isSelected: boolean;
  onRowClick?: ((item: T) => void) | undefined;
}

/**
 * 列幅（colgroup）コンポーネント
 */
const TableColGroup = <T extends object>({
  columns,
}: {
  columns: readonly Column<T>[];
}) => (
  <colgroup>
    {columns.map((col) => (
      <col key={String(col.key)} style={{ width: col.width }} />
    ))}
  </colgroup>
);

/**
 * 行単位の内部コンポーネント
 */
const TableRowInner = <T extends object>({
  row,
  isSelected,
  onRowClick,
}: TableRowProps<T>) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row.original);
  }, [onRowClick, row.original]);

  return (
    <tr
      onClick={handleClick}
      className={clsx(styles.tableRowBase, styles.tableRowStates[state])}
    >
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as TableColumnMeta;
        const align = meta?.align || "left";
        const value = cell.getValue();

        return (
          <td
            key={cell.id}
            title={
              typeof value === "string" || typeof value === "number"
                ? String(value)
                : undefined
            }
            className={clsx(styles.tdBase, styles.tdAlignVariants[align])}
          >
            {cell.column.columnDef.cell ? (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            ) : (
              <span className={styles.cellText}>{String(value ?? "-")}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};

const TableRow = React.memo(
  TableRowInner,
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.row.original === next.row.original &&
    prev.onRowClick === next.onRowClick,
) as typeof TableRowInner;

export const DataTable = <T extends object>({
  data,
  columns,
  rowKey,
  selectedId,
  onRowClick,
}: DataTableProps<T>) => {
  "use no memo"; // React Compiler に対し、TanStack Table 互換のためのメモ化スキップを明確に指示

  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => {
      const keyStr = String(col.key);
      const align = col.align || "left";
      return {
        id: keyStr,
        header: col.label,
        accessorFn: (row) =>
          getValueByPath(row as Record<string, unknown>, keyStr),
        cell: (info) =>
          col.render ? (
            col.render(info.row.original)
          ) : (
            <span className={styles.cellText}>
              {String(info.getValue() ?? "-")}
            </span>
          ),
        meta: { width: col.width, align },
      };
    });
  }, [columns]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table (useReactTable) は React Compiler の自動メモ化と非互換なため、"use no memo" でスキップ指示済み
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          <TableColGroup columns={columns} />
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as TableColumnMeta;
                  const align = meta?.align || "left";
                  return (
                    <th
                      key={header.id}
                      className={clsx(
                        styles.thBase,
                        styles.thAlignVariants[align],
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      <div className={styles.bodyWrapper}>
        <table className={styles.bodyTable}>
          <TableColGroup columns={columns} />
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const id =
                typeof rowKey === "function"
                  ? rowKey(row.original)
                  : String(row.original[rowKey]);
              const isSelected = String(selectedId) === id;

              return (
                <TableRow
                  key={row.id}
                  row={row}
                  rowKey={rowKey}
                  isSelected={isSelected}
                  onRowClick={onRowClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DataTable.displayName = "DataTable";
