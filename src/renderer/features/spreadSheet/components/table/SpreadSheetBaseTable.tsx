// src/renderer/features/spreadSheet/components/table/SpreadSheetBaseTable.tsx

import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { Column } from "@shared/types/table/tableType";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { useAppStore } from "@renderer/store";
import * as defaultStyles from "@renderer/styles/global/globalTable.css";

export type SpreadSheetTableStyles = typeof defaultStyles;

export interface SpreadSheetBaseTableProps<T> {
  readonly rows: readonly T[];
  readonly columns: readonly Column<T>[];
  readonly selectedId?: string;
  readonly getRowId?: (row: T, index: number) => string;
  readonly onRowClick?: (item: T) => void;
  readonly renderCell?: (
    row: T,
    col: Column<T>,
    value: unknown,
  ) => React.ReactNode;
  readonly styles?: SpreadSheetTableStyles;
}

interface TableRowProps<T> {
  readonly row: T;
  readonly columns: readonly Column<T>[];
  readonly isSelected: boolean;
  readonly onRowClick?: (item: T) => void;
  readonly renderCell?: (
    row: T,
    col: Column<T>,
    value: unknown,
  ) => React.ReactNode;
  readonly styles: SpreadSheetTableStyles;
}

function getCellValue<T>(row: T, column: Column<T>): unknown {
  return (row as Record<string, unknown>)[column.key as string];
}

function getCellText(value: unknown): string {
  return value == null || value === "" ? "-" : String(value);
}

function renderColumnGroup<T>(columns: readonly Column<T>[]) {
  return (
    <colgroup>
      {columns.map((column) => (
        <col key={String(column.key)} style={{ width: column.width }} />
      ))}
    </colgroup>
  );
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
      {columns.map((column) => {
        const value = getCellValue(row, column);
        const alignClass =
          styles.alignVariants[column.align ?? "left"] ??
          styles.alignVariants.left;

        return (
          <td
            key={String(column.key)}
            className={`${styles.tdBase} ${alignClass}`}
          >
            {renderCell ? (
              renderCell(row, column, value)
            ) : (
              <span className={styles.cellText}>{getCellText(value)}</span>
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
  styles = defaultStyles,
}: SpreadSheetBaseTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredScrollKeyRef = useRef<string | null>(null);

  const currentView = useAppStore((state) => state.currentView);
  const setScrollPosition = useAppStore((state) => state.setScrollPosition);

  const scrollKey = currentView;

  // データが表示可能になったタイミングで保存位置を復元する
  useLayoutEffect(() => {
    if (restoredScrollKeyRef.current === scrollKey) {
      return;
    }

    if (rows.length === 0) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const savedPosition = useAppStore.getState().scrollPositions[scrollKey];

    container.scrollTop = savedPosition?.top ?? 0;
    container.scrollLeft = savedPosition?.left ?? 0;

    restoredScrollKeyRef.current = scrollKey;
  }, [scrollKey, rows.length]);

  // スクロール位置を画面ID単位で保存する
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget;

      setScrollPosition(scrollKey, {
        top: container.scrollTop,
        left: container.scrollLeft,
      });
    },
    [scrollKey, setScrollPosition],
  );

  if (rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          {renderColumnGroup(columns)}
          <thead>
            <tr>
              {columns.map((column) => {
                const alignClass =
                  styles.alignVariants[column.align ?? "left"] ??
                  styles.alignVariants.left;

                return (
                  <th
                    key={String(column.key)}
                    className={`${styles.thBase} ${alignClass}`}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      <div
        ref={containerRef}
        className={styles.bodyWrapper}
        onScroll={handleScroll}
      >
        <table className={styles.bodyTable}>
          {renderColumnGroup(columns)}
          <tbody>
            {rows.map((row, index) => {
              const idKey = getRowId ? getRowId(row, index) : String(index);

              return (
                <SpreadSheetBaseTableRow
                  key={`${idKey}-${index}`}
                  row={row}
                  columns={columns}
                  isSelected={selectedId === idKey}
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
