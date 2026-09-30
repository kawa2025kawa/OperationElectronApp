import { memo, useCallback } from "react";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { JUGYOIN_COLUMNS } from "../JugyoinView";
import * as styles from "./JugyoinTable.css";

const TableColGroup = () => (
  <colgroup>
    {JUGYOIN_COLUMNS.map((col) => (
      <col key={String(col.key)} style={{ width: col.width }} />
    ))}
  </colgroup>
);

interface JugyoinTableRowProps {
  row: Jugyoin;
  isSelected: boolean;
  onRowClick?: (item: Jugyoin) => void;
}

const JugyoinTableRowInner = ({
  row,
  isSelected,
  onRowClick,
}: JugyoinTableRowProps) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      onClick={handleClick}
    >
      {JUGYOIN_COLUMNS.map((col) => {
        const value = row[col.key as keyof Jugyoin];
        const alignClass = styles.alignVariants[col.align ?? "left"];

        return (
          <td
            key={String(col.key)}
            className={`${styles.tdBase} ${alignClass}`}
          >
            <span className={styles.cellText}>
              {value == null || value === "" ? "-" : String(value)}
            </span>
          </td>
        );
      })}
    </tr>
  );
};

const JugyoinTableRow = memo(JugyoinTableRowInner);

export interface JugyoinTableProps {
  rows: readonly Jugyoin[];
  selectedId?: string;
  onRowClick?: (item: Jugyoin) => void;
}

export const JugyoinTable = memo(
  ({ rows, selectedId, onRowClick }: JugyoinTableProps) => {
    if (rows.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <table className={styles.headerTable}>
            <TableColGroup />
            <thead>
              <tr>
                {JUGYOIN_COLUMNS.map((col) => {
                  const alignClass = styles.alignVariants[col.align ?? "left"];

                  return (
                    <th
                      key={String(col.key)}
                      className={`${styles.thBase} ${alignClass}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>

        <div className={styles.bodyWrapper}>
          <table className={styles.bodyTable}>
            <TableColGroup />
            <tbody>
              {rows.map((row, index) => {
                const idKey = row.name
                  ? String(row.name).trim()
                  : String(index);
                const isSelected = selectedId === idKey;

                return (
                  <JugyoinTableRow
                    key={`${idKey}-${index}`}
                    row={row}
                    isSelected={isSelected}
                    onRowClick={onRowClick}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

JugyoinTable.displayName = "JugyoinTable";
