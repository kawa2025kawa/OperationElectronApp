// src/renderer/features/spreadSheet/components/table/SpreadSheetTableHeader.tsx

import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";

import type { SpreadSheetTableInstance } from "./useSpreadSheetTable";
import { getColumnAlign } from "./spreadSheetTableUtils";
import * as styles from "./spreadSheetTable.css";

interface SpreadSheetTableHeaderProps<TData extends RowData> {
  readonly table: SpreadSheetTableInstance<TData>;
  readonly variant: "grouped" | "standard";
  readonly placeholderColumnId?: string;
  readonly placeholderContent?: ReactNode;
}

function GroupedTableHeader<TData extends RowData>({
  table,
  placeholderColumnId,
  placeholderContent,
}: Omit<SpreadSheetTableHeaderProps<TData>, "variant">) {
  const headerGroup = table.getHeaderGroups()[0];

  return (
    <thead className={styles.tableHeader}>
      <tr>
        {headerGroup?.headers.map((header) => {
          const leafHeaders = header
            .getLeafHeaders()
            .filter((item) => item.column.columns.length === 0);

          if (header.isPlaceholder) {
            if (
              header.column.id === placeholderColumnId &&
              placeholderContent
            ) {
              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className={styles.thCellBase}
                >
                  <div className={styles.thPlaceholderContent}>
                    {placeholderContent}
                  </div>
                </th>
              );
            }

            const target = leafHeaders[0] ?? header;
            const align = getColumnAlign(target.column.columnDef.meta);

            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                className={styles.thCellBase}
              >
                <div
                  className={`${styles.thCardSingle} ${styles.alignVariants[align]}`}
                >
                  <table.FlexRender header={target} />
                </div>
              </th>
            );
          }

          if (leafHeaders.length > 1) {
            const hasGroupHeader = Boolean(header.column.columnDef.header);

            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                className={styles.thCellBase}
              >
                <div className={styles.thCardGroup}>
                  {hasGroupHeader && (
                    <div className={styles.thCardGroupTop}>
                      <table.FlexRender header={header} />
                    </div>
                  )}

                  <div className={styles.thCardSubRow}>
                    {leafHeaders.map((leafHeader) => {
                      const align = getColumnAlign(
                        leafHeader.column.columnDef.meta,
                      );

                      return (
                        <div
                          key={leafHeader.id}
                          className={`${styles.thCardSubCell} ${styles.alignVariants[align]}`}
                          style={{
                            flex: `${leafHeader.column.getSize()} 0 0`,
                          }}
                        >
                          <table.FlexRender header={leafHeader} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </th>
            );
          }

          const align = getColumnAlign(header.column.columnDef.meta);

          return (
            <th key={header.id} className={styles.thCellBase}>
              <div
                className={`${styles.thCardSingle} ${styles.alignVariants[align]}`}
              >
                <table.FlexRender header={header} />
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function StandardTableHeader<TData extends RowData>({
  table,
}: Pick<SpreadSheetTableHeaderProps<TData>, "table">) {
  return (
    <thead className={styles.tableHeader}>
      {table.getHeaderGroups().map((group) => (
        <tr key={group.id} className={styles.thRowCard}>
          {group.headers.map((header) => {
            const align = getColumnAlign(header.column.columnDef.meta);

            return (
              <th
                key={header.id}
                colSpan={header.isPlaceholder ? header.colSpan : undefined}
                className={`${styles.thCellStandard} ${styles.alignVariants[align]}`}
              >
                {!header.isPlaceholder && <table.FlexRender header={header} />}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}

export function SpreadSheetTableHeader<TData extends RowData>({
  table,
  variant,
  placeholderColumnId,
  placeholderContent,
}: SpreadSheetTableHeaderProps<TData>) {
  return variant === "standard" ? (
    <StandardTableHeader table={table} />
  ) : (
    <GroupedTableHeader
      table={table}
      placeholderColumnId={placeholderColumnId}
      placeholderContent={placeholderContent}
    />
  );
}
