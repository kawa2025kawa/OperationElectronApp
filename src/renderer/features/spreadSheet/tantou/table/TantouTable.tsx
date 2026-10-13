import { memo } from "react";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import type { Column } from "@shared/types/table/tableType";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import * as styles from "./TantouTable.css";

// --- テーブルカラム定義 (こちらに移動して循環参照を回避) ---
export const TANTOU_COLUMNS: readonly Column<Tantou>[] = [
  { key: "todayHayaban", label: "早番", width: "10.5%" },
  { key: "todayShikai", label: "司会", width: "10.5%" },
  { key: "todayUketsuke", label: "受付", width: "10.5%" },
  { key: "todayDenwa", label: "電話", width: "10.5%" },
  { key: "todayNimotsu", label: "荷物", width: "10.5%" },
  { key: "todayFloor2", label: "2F", width: "8.5%" },
  { key: "todayFloor3", label: "3F", width: "8.5%" },
  { key: "todayTensou", label: "転送", width: "10.5%" },
  { key: "todayAmAttendanceRate", label: "AM出勤率", width: "10%" },
  { key: "todayPmAttendanceRate", label: "PM出勤率", width: "10%" },
] as const;

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

const TantouTableRow = memo(
  ({ row, isSelected, onRowClick }: TantouTableRowProps) => {
    const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

    return (
      <tr
        className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
        onClick={() => onRowClick?.(row)}
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
  },
);

TantouTableRow.displayName = "TantouTableRow";

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
                    key={index}
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

TantouTable.displayName = "TantouTable";
