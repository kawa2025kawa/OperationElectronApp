import { memo, useCallback } from "react";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { TANTOU_COLUMNS } from "../TantouView";
import * as styles from "./TantouTable.css";

const TableColGroup = () => (
  <colgroup>
    {TANTOU_COLUMNS.map((col) => (
      <col key={String(col.key)} style={{ width: col.width }} />
    ))}
  </colgroup>
);

interface TantouTableRowProps {
  row: Tantou;
  isSelected: boolean;
  onRowClick?: (item: Tantou) => void;
}

const TantouTableRowInner = ({
  row,
  isSelected,
  onRowClick,
}: TantouTableRowProps) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      onClick={handleClick}
    >
      {TANTOU_COLUMNS.map((col) => {
        const value = row[col.key as keyof Tantou];
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

const TantouTableRow = memo(TantouTableRowInner);

export interface TantouTableProps {
  rows: readonly Tantou[];
  selectedId?: string;
  onRowClick?: (item: Tantou) => void;
}

export const TantouTable = memo(
  ({ rows, selectedId, onRowClick }: TantouTableProps) => {
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
                {TANTOU_COLUMNS.map((col) => {
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
                const idKey = String(index);
                const isSelected = selectedId === idKey;

                return (
                  <TantouTableRow
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
