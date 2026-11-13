// src/renderer/features/spreadSheet/components/table/SpreadSheetTable.tsx

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import type { RowData, TableOptions } from "@tanstack/react-table";

import type { SpreadSheetTableFeatures } from "./spreadsheetTableConfig";
import { useSpreadSheetTable } from "./useSpreadSheetTable";
import { SpreadSheetTableHeader } from "./SpreadSheetTableHeader";
import { getColumnAlign } from "./spreadSheetTableUtils";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import * as styles from "./spreadSheetTable.css";

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
  const { containerRef, table, handleScroll } = useSpreadSheetTable(
    rows,
    columns,
    getRowId,
  );

  const headerWrapperRef = useRef<HTMLDivElement | null>(null);
  const leafColumns = table.getAllLeafColumns();
  const tableRows = table.getRowModel().rows;

  const handleBodyScroll = useCallback(() => {
    const body = containerRef.current;
    const header = headerWrapperRef.current;

    if (body && header) header.scrollLeft = body.scrollLeft;
    handleScroll();
  }, [containerRef, handleScroll]);

  useLayoutEffect(() => {
    const header = headerWrapperRef.current;
    const body = containerRef.current;

    if (header && body) header.scrollLeft = body.scrollLeft;
  });

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
            {tableRows.map((row) => (
              <tr
                key={row.id}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
