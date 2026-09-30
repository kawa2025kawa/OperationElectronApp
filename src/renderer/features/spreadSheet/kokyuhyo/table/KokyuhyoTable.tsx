import { memo, useCallback } from "react";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { KOKYUHYO_COLUMNS } from "../KokyuhyoView";
import * as styles from "./KokyuhyoTable.css";

const checkIsHolidayText = (value: unknown): boolean => {
  if (value == null || typeof value === "object") return false;
  const text = String(value);
  return (
    text.includes("公休") ||
    text.includes("有休") ||
    text.includes("特休") ||
    text.includes("休")
  );
};

const TableColGroup = () => (
  <colgroup>
    {KOKYUHYO_COLUMNS.map((col) => (
      <col key={String(col.key)} style={{ width: col.width }} />
    ))}
  </colgroup>
);

interface KokyuhyoTableRowProps {
  row: Kokyuhyo;
  isSelected: boolean;
  onRowClick?: (item: Kokyuhyo) => void;
}

const KokyuhyoTableRowInner = ({
  row,
  isSelected,
  onRowClick,
}: KokyuhyoTableRowProps) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      onClick={handleClick}
    >
      {KOKYUHYO_COLUMNS.map((col) => {
        const value = row[col.key as keyof Kokyuhyo];
        const alignClass = styles.alignVariants[col.align ?? "left"];
        const isHoliday = checkIsHolidayText(value);

        return (
          <td
            key={String(col.key)}
            className={`${styles.tdBase} ${alignClass}`}
          >
            <span
              className={`${styles.cellText} ${
                isHoliday ? styles.cellTextHoliday : ""
              }`}
            >
              {value == null || value === "" ? "-" : String(value)}
            </span>
          </td>
        );
      })}
    </tr>
  );
};

const KokyuhyoTableRow = memo(KokyuhyoTableRowInner);

export interface KokyuhyoTableProps {
  rows: readonly Kokyuhyo[];
  selectedId?: string;
  onRowClick?: (item: Kokyuhyo) => void;
}

export const KokyuhyoTable = memo(
  ({ rows, selectedId, onRowClick }: KokyuhyoTableProps) => {
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
                {KOKYUHYO_COLUMNS.map((col) => {
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
                  <KokyuhyoTableRow
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

KokyuhyoTable.displayName = "KokyuhyoTable";
