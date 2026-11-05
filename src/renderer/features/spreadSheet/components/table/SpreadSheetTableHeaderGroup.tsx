// src/renderer/features/spreadSheet/components/table/SpreadSheetTableHeaderGroup.tsx

import { memo } from "react";
import type { Column } from "@shared/types/table/tableType";
import type { SpreadSheetTableStyles } from "./SpreadSheetBaseTable";

export interface SpreadSheetTableHeaderGroupProps<T> {
  readonly columns: readonly Column<T>[];
  readonly styles: SpreadSheetTableStyles;
}

type GroupedCardItem<T> =
  | {
      type: "single";
      column: Column<T>;
    }
  | {
      type: "group";
      groupKey: string;
      label: string;
      span: number;
      subColumns: Column<T>[];
    };

function buildGroupCards<T>(
  columns: readonly Column<T>[],
): GroupedCardItem<T>[] {
  const result: GroupedCardItem<T>[] = [];

  columns.forEach((col) => {
    if (col.headerGroup) {
      const last = result[result.length - 1];
      if (
        last &&
        last.type === "group" &&
        last.groupKey === col.headerGroup.groupKey
      ) {
        last.span += 1;
        last.subColumns.push(col);
      } else {
        result.push({
          type: "group",
          groupKey: col.headerGroup.groupKey,
          label: col.headerGroup.label,
          span: 1,
          subColumns: [col],
        });
      }
    } else {
      result.push({
        type: "single",
        column: col,
      });
    }
  });

  return result;
}

function SpreadSheetTableHeaderGroupInner<T>({
  columns,
  styles,
}: SpreadSheetTableHeaderGroupProps<T>) {
  const headerCards = buildGroupCards(columns);

  return (
    <thead>
      <tr>
        {headerCards.map((card, index) => {
          if (card.type === "single") {
            const alignClass =
              styles.alignVariants[card.column.align ?? "left"] ??
              styles.alignVariants.left;

            return (
              <th
                key={`single-${String(card.column.key)}`}
                className={styles.thCellBase}
              >
                <div className={`${styles.thCardSingle} ${alignClass}`}>
                  {card.column.label}
                </div>
              </th>
            );
          }

          const totalWidth = card.subColumns.reduce((acc, col) => {
            const val =
              typeof col.width === "string"
                ? parseFloat(col.width)
                : Number(col.width || 1);
            return acc + (isNaN(val) ? 1 : val);
          }, 0);

          return (
            <th
              key={`group-${card.groupKey ?? index}`}
              colSpan={card.span}
              className={styles.thCellBase}
            >
              <div className={styles.thCardGroup}>
                <div className={styles.thCardTitle}>{card.label}</div>
                <div className={styles.thCardSubRow}>
                  {card.subColumns.map((subCol) => {
                    const val =
                      typeof subCol.width === "string"
                        ? parseFloat(subCol.width)
                        : Number(subCol.width || 1);
                    const flexBasis =
                      totalWidth > 0 ? `${(val / totalWidth) * 100}%` : "auto";

                    return (
                      <div
                        key={`sub-${String(subCol.key)}`}
                        className={styles.thCardSubCell}
                        style={{
                          flex: `0 0 ${flexBasis}`,
                          justifyContent: "flex-start",
                        }}
                      >
                        {subCol.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export const SpreadSheetTableHeaderGroup = memo(
  SpreadSheetTableHeaderGroupInner,
) as typeof SpreadSheetTableHeaderGroupInner;
