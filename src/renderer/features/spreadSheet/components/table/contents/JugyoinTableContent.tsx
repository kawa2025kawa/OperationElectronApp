// src/renderer/features/spreadSheet/components/table/contents/JugyoinTableContent.tsx

import React, { useCallback } from "react";
import type {
  Column,
  SpreadSheetTableProps,
  TableRowProps,
} from "@shared/types/table/tableType";
import { getValueByPath } from "@shared/utils/getValueByPath";
import * as styles from "../spreadSheetTable.css";
import {
  areRowPropsEqual,
  getCellValue,
  useHeaderGroups,
} from "../useSpreadSheetTable";

export interface JugyoinTableContentProps<
  T extends object,
> extends SpreadSheetTableProps<T> {
  virtualItems: Array<{ index: number; start: number }>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  totalSize: number;
}

const TableHeader = <T extends object>({
  columns,
}: {
  columns: readonly Column<T>[];
}) => {
  const groupedColumns = useHeaderGroups(columns);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 1段目：グループヘッダー */}
      <div
        className={styles.headerRow}
        style={{ minHeight: "36px", height: "36px", paddingBlock: "2px" }}
      >
        {groupedColumns.ungrouped.map((col) => {
          const width = col.width ?? "150px";
          return (
            <div
              key={`top-${String(col.key)}`}
              className={styles.thBase}
              style={{
                width,
                minWidth: width,
                maxWidth: width,
                height: "100%",
              }}
            />
          );
        })}
        {groupedColumns.groups.map((group, idx) => (
          <div
            key={`group-${idx}`}
            className={styles.headerGroupCell}
            style={{
              width: `calc(${group.width} - 4px)`,
              minWidth: `calc(${group.width} - 4px)`,
              maxWidth: `calc(${group.width} - 4px)`,
              height: "100%",
            }}
          >
            {group.label}
          </div>
        ))}
      </div>
      {/* 2段目：詳細項目（AM/PM等） */}
      <div
        className={styles.headerRow}
        style={{ minHeight: "36px", height: "36px", paddingBlock: "2px" }}
      >
        {columns.map((col) => {
          const alignClass = styles.thAlignVariants[col.align ?? "left"] ?? "";
          const width = col.width ?? "150px";
          const isSubGroupCol = col.headerGroup != null;
          return (
            <div
              key={String(col.key)}
              className={`${styles.thBase} ${
                isSubGroupCol ? styles.headerGroupCell : ""
              } ${alignClass}`}
              style={{
                width: isSubGroupCol ? `calc(${width} - 4px)` : width,
                minWidth: isSubGroupCol ? `calc(${width} - 4px)` : width,
                maxWidth: isSubGroupCol ? `calc(${width} - 4px)` : width,
                height: "100%",
              }}
            >
              {col.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

export const JugyoinTableContent = <T extends object>({
  columns,
  virtualItems,
  data,
  rowKey = "id",
  selectedId,
  onRowClick,
  parentRef,
  totalSize,
}: JugyoinTableContentProps<T>) => {
  return (
    <>
      <div className={styles.headerWrapper}>
        <TableHeader columns={columns} />
      </div>
      <div ref={parentRef} className={styles.bodyWrapper}>
        <div
          className={styles.virtualBody}
          style={{ height: `${totalSize}px` }}
        >
          <div className={styles.virtualBodyContent}>
            {virtualItems.map((virtualRow) => {
              const item = data[virtualRow.index];
              const id = String(
                typeof rowKey === "function"
                  ? rowKey(item)
                  : (getValueByPath(
                      item as Record<string, unknown>,
                      String(rowKey),
                    ) ?? virtualRow.index),
              );
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
            })}
          </div>
        </div>
      </div>
    </>
  );
};
