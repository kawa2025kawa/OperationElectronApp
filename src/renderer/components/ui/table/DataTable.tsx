import React, { useCallback } from "react";
import { clsx } from "clsx";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { Column } from "@shared/types/table";
import * as styles from "./dataTable.css";

export interface DataTableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  rowKey: keyof T | ((item: T) => string | number);
  selectedId?: string | number | null | undefined;
  onRowClick?: ((item: T) => void) | undefined;
}

interface TableRowProps<T> {
  item: T;
  columns: readonly Column<T>[];
  isSelected: boolean;
  onRowClick?: ((item: T) => void) | undefined;
}

/**
 * 1. 列幅（colgroup）コンポーネント
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
 * 2. 行単位の内部コンポーネント
 */
const TableRowInner = <T extends object>({
  item,
  columns,
  isSelected,
  onRowClick,
}: TableRowProps<T>) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(item);
  }, [onRowClick, item]);

  return (
    <tr
      onClick={handleClick}
      className={clsx(styles.tableRowBase, styles.tableRowStates[state])}
    >
      {columns.map((col) => {
        const keyStr = String(col.key);
        const align = col.align || "left";
        const rawValue = col.render
          ? col.render(item)
          : getValueByPath(item as Record<string, unknown>, keyStr);

        return (
          <td
            key={keyStr}
            title={
              typeof rawValue === "string" || typeof rawValue === "number"
                ? String(rawValue)
                : undefined
            }
            className={clsx(styles.tdBase, styles.tdAlignVariants[align])}
          >
            {col.render ? (
              (rawValue as React.ReactNode)
            ) : (
              <span className={styles.cellText}>{String(rawValue ?? "-")}</span>
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
    prev.item === next.item &&
    prev.onRowClick === next.onRowClick,
) as typeof TableRowInner;

/**
 * 3. メイン DataTable コンポーネント (TanStack Table 不使用版)
 */
export const DataTable = <T extends object>({
  data,
  columns,
  rowKey,
  selectedId,
  onRowClick,
}: DataTableProps<T>) => {
  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          <TableColGroup columns={columns} />
          <thead>
            <tr>
              {columns.map((col) => {
                const align = col.align || "left";
                return (
                  <th
                    key={String(col.key)}
                    className={clsx(
                      styles.thBase,
                      styles.thAlignVariants[align],
                    )}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* Body */}
      <div className={styles.bodyWrapper}>
        <table className={styles.bodyTable}>
          <TableColGroup columns={columns} />
          <tbody>
            {data.map((item) => {
              const id =
                typeof rowKey === "function"
                  ? rowKey(item)
                  : String(item[rowKey]);
              const isSelected = String(selectedId) === id;

              return (
                <TableRow
                  key={id}
                  item={item}
                  columns={columns}
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
