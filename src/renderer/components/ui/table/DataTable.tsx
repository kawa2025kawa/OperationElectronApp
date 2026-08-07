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
 * 行単位の内部コンポーネント
 */
const TableRowInner = <T extends object>({
  row,
  isSelected,
  onRowClick,
}: TableRowProps<T>) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  // クリックハンドラをメモ化して再生成を防止[cite: 3]
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
            style={{ width: meta?.width }}
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

/**
 * React.memo による行描画の最適化
 * 選択状態 (isSelected) や 行データ (row.original) が変更されない限り、再レンダリングをスキップ[cite: 3]
 */
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
      <div className={styles.headerArea} style={{ height: "56px" }}>
        <table className={styles.tableStyle}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as TableColumnMeta;
                  const align = meta?.align || "left";
                  return (
                    <th
                      key={header.id}
                      style={{ width: meta?.width }}
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
        <table className={styles.tableStyle}>
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
