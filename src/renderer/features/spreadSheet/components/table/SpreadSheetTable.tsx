import React, { useCallback } from "react";
import type { Column } from "@shared/types/tableType";
import type {
  SpreadSheetTableProps,
  TableRowProps,
} from "@shared/types/spreadsheetTypes";
import { getValueByPath } from "@shared/utils/getValueByPath";
import * as styles from "./spreadSheetTable.css";
import { areRowPropsEqual, useSpreadSheetTable } from "./useSpreadSheetTable";

// --------------------------------------------------------------------------
// TableHeader
// --------------------------------------------------------------------------

const TableHeader = <T extends object>({
  columns,
}: {
  columns: readonly Column<T>[];
}) => (
  <div className={styles.headerRow}>
    {columns.map((col) => {
      const alignKey = col.align ?? "left";
      const alignClass = styles.thAlignVariants[alignKey] ?? "";
      const widthVal = col.width ?? "150px";

      return (
        <div
          key={String(col.key)}
          className={`${styles.thBase} ${alignClass}`}
          style={{
            width: widthVal,
            minWidth: widthVal,
            maxWidth: widthVal,
          }}
        >
          {col.label}
        </div>
      );
    })}
  </div>
);

// --------------------------------------------------------------------------
// TableRow
// --------------------------------------------------------------------------

const TableRowInner = <T extends object>({
  item,
  columns,
  isSelected,
  onRowClick,
  dataIndex,
  style,
}: TableRowProps<T>) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(item);
  }, [onRowClick, item]);

  return (
    <div data-index={dataIndex} style={style} className={styles.tableRowSlot}>
      <div
        onClick={handleClick}
        className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      >
        {columns.map((col) => {
          const keyStr = String(col.key);
          const align = col.align ?? "left";
          const alignClass = styles.tdAlignVariants[align] ?? "";

          const rawValue = col.render
            ? col.render(item)
            : getValueByPath(item as Record<string, unknown>, keyStr);

          const widthVal = col.width ?? "150px";

          return (
            <div
              key={keyStr}
              className={`${styles.tdBase} ${alignClass}`}
              style={{
                width: widthVal,
                minWidth: widthVal,
                maxWidth: widthVal,
              }}
            >
              <span className={styles.cellText}>
                {rawValue != null && typeof rawValue === "object"
                  ? (rawValue as React.ReactNode)
                  : String(rawValue ?? "-")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TableRow = React.memo(
  TableRowInner,
  areRowPropsEqual,
) as typeof TableRowInner;

// --------------------------------------------------------------------------
// SpreadSheetTable
// --------------------------------------------------------------------------

export const SpreadSheetTableComponent = <T extends object>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectedId,
}: SpreadSheetTableProps<T>) => {
  // ⭕ measureElement の分割代入を削除
  const { parentRef, virtualItems, totalSize } = useSpreadSheetTable({ data });

  return (
    <div className={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className={styles.headerWrapper}>
        <TableHeader columns={columns} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Body                                                               */}
      {/* ------------------------------------------------------------------ */}

      <div ref={parentRef} className={styles.bodyWrapper}>
        <div
          className={styles.virtualBody}
          style={{
            height: `${totalSize}px`,
          }}
        >
          {!data || data.length === 0 ? (
            <div className={styles.emptyText}>データが存在しません</div>
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
        </div>
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
