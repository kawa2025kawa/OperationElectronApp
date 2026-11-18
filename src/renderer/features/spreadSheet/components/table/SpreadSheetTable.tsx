// src/renderer/features/spreadSheet/components/table/SpreadSheetTable.tsx

import type { ReactNode } from "react";
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
  "use no memo";

  const {
    headerWrapperRef,
    containerRef,
    table,
    columnWidths,
    tableRows,
    colSpanCount,
    virtualItems,
    paddingTop,
    paddingBottom,
    isEmpty,
    handleScroll,
  } = useSpreadSheetTable(rows, columns, getRowId);

  if (isEmpty) return <EmptyState />;

  const renderColGroup = () => (
    <colgroup>
      {columnWidths.map((column) => (
        <col key={column.id} style={{ width: column.width }} />
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
        onScroll={handleScroll}
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