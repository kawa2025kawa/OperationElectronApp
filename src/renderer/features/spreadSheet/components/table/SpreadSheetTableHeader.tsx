// src/renderer/features/spreadSheet/components/table/SpreadSheetTableHeader.tsx

import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";

import type { SpreadSheetTableInstance } from "./useSpreadSheetTable";
import { useSpreadSheetTableHeader } from "./useSpreadSheetTableHeader";
import * as styles from "./spreadSheetTable.css";

interface SpreadSheetTableHeaderProps<TData extends RowData> {
  readonly table: SpreadSheetTableInstance<TData>;
  readonly variant: "grouped" | "standard";
  readonly placeholderColumnId?: string;
  readonly placeholderContent?: ReactNode;
}

export function SpreadSheetTableHeader<TData extends RowData>({
  table,
  variant,
  placeholderColumnId,
  placeholderContent,
}: SpreadSheetTableHeaderProps<TData>) {
  "use no memo";

  const { groupedCells, standardGroups } = useSpreadSheetTableHeader(
    table,
    placeholderColumnId,
    placeholderContent,
  );

  if (variant === "standard") {
    return (
      <thead className={styles.tableHeader}>
        {standardGroups.map((group) => (
          <tr key={group.id} className={styles.thRowCard}>
            {group.headers.map((header) => (
              <th
                key={header.id}
                colSpan={header.colSpan}
                className={`${styles.thCellStandard} ${styles.alignVariants[header.align]}`}
              >
                {!header.isPlaceholder && (
                  <table.FlexRender header={header.header} />
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
    );
  }

  return (
    <thead className={styles.tableHeader}>
      <tr>
        {groupedCells.map((cell) => {
          if (cell.kind === "customPlaceholder") {
            return (
              <th
                key={cell.id}
                colSpan={cell.colSpan}
                className={styles.thCellBase}
              >
                <div className={styles.thPlaceholderContent}>
                  {cell.content}
                </div>
              </th>
            );
          }

          if (cell.kind === "group") {
            return (
              <th
                key={cell.id}
                colSpan={cell.colSpan}
                className={styles.thCellBase}
              >
                <div className={styles.thCardGroup}>
                  {cell.hasGroupHeader && (
                    <div className={styles.thCardGroupTop}>
                      <table.FlexRender header={cell.header} />
                    </div>
                  )}

                  <div className={styles.thCardSubRow}>
                    {cell.leaves.map((leaf) => (
                      <div
                        key={leaf.id}
                        className={`${styles.thCardSubCell} ${styles.alignVariants[leaf.align]}`}
                        style={{ flex: leaf.flex }}
                      >
                        <table.FlexRender header={leaf.header} />
                      </div>
                    ))}
                  </div>
                </div>
              </th>
            );
          }

          return (
            <th
              key={cell.id}
              colSpan={cell.colSpan}
              className={styles.thCellBase}
            >
              <div
                className={`${styles.thCardSingle} ${styles.alignVariants[cell.align]}`}
              >
                <table.FlexRender header={cell.header} />
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}