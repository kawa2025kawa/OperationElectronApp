// src/renderer/features/spreadSheet/components/table/SpreadSheetTable.tsx

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import type { RowData, TableOptions } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { SpreadSheetTableFeatures } from "./spreadsheetTableConfig";
import { useSpreadSheetTable } from "./useSpreadSheetTable";
import { SpreadSheetTableHeader } from "./SpreadSheetTableHeader";
import { getColumnAlign } from "./spreadSheetTableUtils";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import * as styles from "./spreadSheetTable.css";

/** tokens.size.tableRowHeight (56px) + borderSpacing vertical (12px) */
const VIRTUAL_ROW_ESTIMATE_PX = 68;
const VIRTUAL_OVERSCAN_COUNT = 8;

export interface SpreadSheetTableProps<TData extends RowData> {
  readonly rows: readonly TData[] | undefined;
  readonly columns: TableOptions<SpreadSheetTableFeatures, TData>["columns"];
  readonly getRowId: (row: TData, index: number) => string;
  readonly onRowClick?: (item: TData) => void;
  readonly headerVariant?: "grouped" | "standard";
  readonly placeholderColumnId?: string;
  readonly placeholderContent?: ReactNode;
  readonly isHolidayCell?: (value: unknown) => boolean;
}

export function SpreadSheetTable<TData extends RowData>({
  rows,
  columns,
  getRowId,
  onRowClick,
  headerVariant = "grouped",
  placeholderColumnId,
  placeholderContent,
  isHolidayCell,
}: SpreadSheetTableProps<TData>) {
  "use no memo";

  const { containerRef, table, handleScroll } = useSpreadSheetTable(
    rows,
    columns,
    getRowId,
  );

  const headerWrapperRef = useRef<HTMLDivElement | null>(null);
  const leafColumns = table.getAllLeafColumns();
  const tableRows = table.getRowModel().rows;
  const colSpanCount = Math.max(leafColumns.length, 1);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => VIRTUAL_ROW_ESTIMATE_PX,
    overscan: VIRTUAL_OVERSCAN_COUNT,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop =
    virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(
          0,
          totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0),
        )
      : 0;

  const handleBodyScroll = useCallback(() => {
    const body = containerRef.current;
    const header = headerWrapperRef.current;

    if (body && header && header.scrollLeft !== body.scrollLeft) {
      header.scrollLeft = body.scrollLeft;
    }
    handleScroll();
  }, [containerRef, handleScroll]);

  useLayoutEffect(() => {
    const header = headerWrapperRef.current;
    const body = containerRef.current;

    if (header && body && header.scrollLeft !== body.scrollLeft) {
      header.scrollLeft = body.scrollLeft;
    }
  }, [containerRef, rows, columns]);

  if (tableRows.length === 0) return <EmptyState />;

  const renderColGroup = () => (
    <colgroup>
      {leafColumns.map((column) => (
        <col key={column.id} style={{ width: `${column.getSize()}%` }} />
      ))}
    </colgroup>
  );

  return (
    <div className={styles.container}>
      <div ref={headerWrapperRef} className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          {renderColGroup()}
          <SpreadSheetTableHeader
            table={table}
            variant={headerVariant}
            placeholderColumnId={placeholderColumnId}
            placeholderContent={placeholderContent}
          />
        </table>
      </div>

      <div
        ref={containerRef}
        className={styles.bodyWrapper}
        onScroll={handleBodyScroll}
      >
        <table className={styles.table}>
          {renderColGroup()}
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={colSpanCount}
                  style={{ height: `${paddingTop}px`, padding: 0, border: 0 }}
                />
              </tr>
            )}

            {virtualItems.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              if (!row) return null;

              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  className={`${styles.tableRowBase} ${
                    styles.tableRowStates[onRowClick ? "clickable" : "idle"]
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getAllCells().map((cell) => {
                    const align = getColumnAlign(cell.column.columnDef.meta);
                    const holiday = isHolidayCell?.(cell.getValue()) ?? false;

                    return (
                      <td
                        key={cell.id}
                        className={`${styles.tdBase} ${styles.alignVariants[align]}`}
                      >
                        <span
                          className={`${styles.cellText} ${
                            holiday ? styles.cellTextHoliday : ""
                          }`}
                        >
                          <table.FlexRender cell={cell} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={colSpanCount}
                  style={{
                    height: `${paddingBottom}px`,
                    padding: 0,
                    border: 0,
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
