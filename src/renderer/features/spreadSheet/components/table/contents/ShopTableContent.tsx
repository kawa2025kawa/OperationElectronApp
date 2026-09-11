// src/renderer/features/spreadSheet/components/table/contents/ShopTableContent.tsx

import React, { useCallback } from "react";
import type { Column, TableRowProps } from "@shared/types";
import { getValueByPath } from "@shared/utils/getValueByPath";
import * as styles from "../spreadSheetTable.css";
import { areRowPropsEqual, getCellValue } from "../useSpreadSheetTable";

interface ShopTableContentProps<T extends object> {
  columns: readonly Column<T>[];
  virtualItems: Array<{ index: number; start: number }>;
  data: T[];
  rowKey: keyof T | string;
  selectedId?: string | number | null;
  onRowClick?: (item: T) => void;
}

const TableHeader = <T extends object>({
  columns,
}: {
  columns: readonly Column<T>[];
}) => (
  <div className={styles.headerRow}>
    {columns.map((col) => {
      const alignClass = styles.thAlignVariants[col.align ?? "left"] ?? "";
      const width = col.width ?? "150px";

      return (
        <div
          key={String(col.key)}
          className={`${styles.thBase} ${alignClass}`}
          style={{ width, minWidth: width, maxWidth: width }}
        >
          {col.label}
        </div>
      );
    })}
  </div>
);

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
          const alignClass = styles.tdAlignVariants[col.align ?? "left"] ?? "";
          const width = col.width ?? "150px";
          const { rawValue, strValue } = getCellValue(item, col);

          return (
            <div
              key={keyStr}
              className={`${styles.tdBase} ${alignClass}`}
              style={{ width, minWidth: width, maxWidth: width }}
            >
              <span className={styles.cellText}>
                {rawValue != null && typeof rawValue === "object"
                  ? (rawValue as React.ReactNode)
                  : strValue || "-"}
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

export const ShopTableContent = <T extends object>({
  columns,
  virtualItems,
  data,
  rowKey,
  selectedId,
  onRowClick,
}: ShopTableContentProps<T>) => {
  return (
    <>
      <div className={styles.headerWrapper}>
        <TableHeader columns={columns} />
      </div>
      <div className={styles.virtualBodyContent}>
        {virtualItems.map((virtualRow) => {
          const item = data[virtualRow.index];
          const keyStr = String(rowKey);
          const id = String(
            getValueByPath(item as Record<string, unknown>, keyStr) ??
              virtualRow.index,
          );
          const isSelected = selectedId != null && String(selectedId) === id;

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
        })}
      </div>
    </>
  );
};
