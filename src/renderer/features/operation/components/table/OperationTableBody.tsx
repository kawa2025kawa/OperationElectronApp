// src/renderer/features/operation/components/table/OperationTableBody.tsx

import { memo, useLayoutEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { useAppStore } from "@renderer/store";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import type { OperationColumn } from "./operationTableConfig";
import { OperationTableRow } from "./OperationTableRow";
import { getOperationColumnMeta } from "./operationTableConfig";
import * as styles from "./operationTable.css";

const EMPTY_CELL_HEIGHT = "240px";

interface OperationTableBodyProps {
  readonly rows: readonly OperationViewItem[];
  readonly columns: readonly OperationColumn[];
  readonly selectedId: string | null | undefined;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
}

const TableColumnGroup = memo(function TableColumnGroup({
  columns,
}: Pick<OperationTableBodyProps, "columns">) {
  return (
    <colgroup>
      {columns.map((column) => (
        <col
          key={column}
          style={{ width: getOperationColumnMeta(column).width }}
        />
      ))}
    </colgroup>
  );
});

TableColumnGroup.displayName = "TableColumnGroup";

export const OperationTableBody = memo(function OperationTableBody({
  rows,
  columns,
  selectedId,
  onRowClick,
  onMarkSuccess,
}: OperationTableBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredScrollKeyRef = useRef<string | null>(null);
  const prevSearchTermRef = useRef("");

  const {
    currentView,
    currentMode,
    searchTerm,
    tableRowsMode,
    setScrollPosition,
  } = useAppStore(
    useShallow((state) => ({
      currentView: state.currentView,
      currentMode: state.currentMode,
      searchTerm: state.searchTerm,
      tableRowsMode: state.tableRowsMode,
      setScrollPosition: state.setScrollPosition,
    })),
  );

  const scrollKey = `${currentView}:${currentMode}`;

  useLayoutEffect(() => {
    if (restoredScrollKeyRef.current === scrollKey) {
      return;
    }

    if (tableRowsMode !== currentMode || rows.length === 0) {
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
  }, [scrollKey, currentMode, tableRowsMode, rows.length]);

  useLayoutEffect(() => {
    const previousSearchTerm = prevSearchTermRef.current;
    prevSearchTermRef.current = searchTerm;

    if (previousSearchTerm && !searchTerm && containerRef.current) {
      const savedPosition = useAppStore.getState().scrollPositions[scrollKey];

      containerRef.current.scrollTop = savedPosition?.top ?? 0;
      containerRef.current.scrollLeft = savedPosition?.left ?? 0;
    }
  }, [searchTerm, rows, scrollKey]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (searchTerm) {
      return;
    }

    const container = event.currentTarget;

    setScrollPosition(scrollKey, {
      top: container.scrollTop,
      left: container.scrollLeft,
    });
  };

  return (
    <div
      ref={containerRef}
      className={styles.bodyWrapper}
      onScroll={handleScroll}
    >
      <table className={styles.bodyTable}>
        <TableColumnGroup columns={columns} />

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                style={{
                  height: EMPTY_CELL_HEIGHT,
                  verticalAlign: "middle",
                }}
              >
                <EmptyState />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const kanriNo = row.kanriNo.trim();

              return (
                <OperationTableRow
                  key={`${kanriNo}-${index}`}
                  row={row}
                  columns={columns}
                  isSelected={selectedId === kanriNo}
                  kanriNo={kanriNo}
                  onRowClick={onRowClick}
                  onMarkSuccess={onMarkSuccess}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

OperationTableBody.displayName = "OperationTableBody";
