// src/renderer/features/spreadSheet/components/table/SpreadSheetTableHeaderSingle.tsx

import { memo } from "react";
import type { Column } from "@shared/types/table/tableType";
import type { SpreadSheetTableStyles } from "./SpreadSheetBaseTable";

export interface SpreadSheetTableHeaderSingleProps<T> {
  readonly columns: readonly Column<T>[];
  readonly styles: SpreadSheetTableStyles;
}

function SpreadSheetTableHeaderSingleInner<T>({
  columns,
  styles,
}: SpreadSheetTableHeaderSingleProps<T>) {
  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const alignClass =
            styles.alignVariants[column.align ?? "left"] ??
            styles.alignVariants.left;

          return (
            <th
              key={String(column.key)}
              className={`${styles.thBase} ${alignClass}`}
            >
              {column.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export const SpreadSheetTableHeaderSingle = memo(
  SpreadSheetTableHeaderSingleInner,
) as typeof SpreadSheetTableHeaderSingleInner;
