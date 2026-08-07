// src/renderer/features/spreadSheet/components/table/SpreadSheetTable.tsx

import React, { useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { Column } from "@shared/types/tableType";
import * as styles from "./spreadSheetTable.css";

export interface SpreadSheetTableProps<T> {
  data: T[];
  columns: readonly Column<T>[];
  rowKey: keyof T;
  onRowClick?: (item: T) => void;
  selectedId?: string | number | null;
}

interface TableRowProps<T> {
  item: T;
  columns: readonly Column<T>[];
  isSelected: boolean;
  onRowClick?: ((item: T) => void) | undefined;
  measureRef?: (element: HTMLTableRowElement | null) => void;
  dataIndex?: number;
  style?: React.CSSProperties;
}

const TableRowInner = <T extends object>({
  item,
  columns,
  isSelected,
  onRowClick,
  measureRef,
  dataIndex,
  style,
}: TableRowProps<T>) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(item);
  }, [onRowClick, item]);

  return (
    <tr
      ref={measureRef}
      data-index={dataIndex}
      onClick={handleClick}
      style={style}
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
    >
      {columns.map((col) => {
        const keyStr = String(col.key);
        const align = col.align || "left";
        const alignClass = styles.tdAlignVariants[align] ?? "";
        const rawValue = col.render
          ? col.render(item)
          : getValueByPath(item as Record<string, unknown>, keyStr);

        const widthVal = col.width ?? "150px";

        return (
          <td
            key={keyStr}
            style={{
              width: widthVal,
              minWidth: widthVal,
              maxWidth: widthVal,
              flexShrink: 0,
              flexGrow: 0,
            }}
            className={`${styles.tdBase} ${alignClass}`}
          >
            <span className={styles.cellText}>
              {rawValue != null && typeof rawValue === "object"
                ? (rawValue as React.ReactNode)
                : String(rawValue ?? "-")}
            </span>
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
    prev.onRowClick === next.onRowClick &&
    prev.dataIndex === next.dataIndex &&
    prev.style?.transform === next.style?.transform,
) as typeof TableRowInner;

export const SpreadSheetTableComponent = <T extends object>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectedId,
}: SpreadSheetTableProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data ? data.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className={styles.container}>
      <div ref={parentRef} className={styles.bodyWrapper}>
        <table className={styles.tableStyle}>
          {/* 🎯 sticky固定ヘッダー（データ行と同一のFlex-tr構造） */}
          <thead className={styles.stickyHeader}>
            <tr className={styles.tableHeaderRow}>
              {columns.map((col) => {
                const alignKey = col.align ?? "left";
                const alignClass = styles.thAlignVariants[alignKey] ?? "";
                const widthVal = col.width ?? "150px";

                return (
                  <th
                    key={String(col.key)}
                    className={`${styles.thBase} ${alignClass}`}
                    style={{
                      width: widthVal,
                      minWidth: widthVal,
                      maxWidth: widthVal,
                      flexShrink: 0,
                      flexGrow: 0,
                    }}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            style={{
              height: `${totalSize}px`,
              position: "relative",
              display: "block",
            }}
          >
            {!data || data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", padding: "32px" }}
                >
                  データが存在しません
                </td>
              </tr>
            ) : (
              virtualItems.map((virtualRow) => {
                const item = data[virtualRow.index];
                const id = String(item[rowKey] ?? "");
                const isSelected =
                  selectedId != null && String(selectedId) === id;

                return (
                  <TableRow
                    key={id}
                    item={item}
                    columns={columns}
                    isSelected={isSelected}
                    onRowClick={onRowClick}
                    measureRef={rowVirtualizer.measureElement}
                    dataIndex={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SpreadSheetTable = React.memo(SpreadSheetTableComponent) as <
  T extends object,
>(
  props: SpreadSheetTableProps<T>,
) => React.ReactElement;

SpreadSheetTableComponent.displayName = "SpreadSheetTable";

export default SpreadSheetTable;
