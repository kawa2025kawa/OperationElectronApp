//src\renderer\features\spreadSheet\shop\table\ShopTable.tsx

import { memo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { SHOP_COLUMNS } from "../ShopView";
import * as styles from "./ShopTable.css";

const TableColGroup = () => (
  <colgroup>
    {SHOP_COLUMNS.map((col) => (
      <col key={String(col.key)} style={{ width: col.width }} />
    ))}
  </colgroup>
);

interface ShopTableRowProps {
  row: Shop;
  isSelected: boolean;
  onRowClick?: (item: Shop) => void;
}

const ShopTableRowInner = ({
  row,
  isSelected,
  onRowClick,
}: ShopTableRowProps) => {
  const state = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      className={`${styles.tableRowBase} ${styles.tableRowStates[state]}`}
      onClick={handleClick}
    >
      {SHOP_COLUMNS.map((col) => {
        const value = row[col.key as keyof Shop];
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

const ShopTableRow = memo(ShopTableRowInner);

export interface ShopTableProps {
  rows: readonly Shop[];
  selectedId?: string;
  onRowClick?: (item: Shop) => void;
}

export const ShopTable = memo(
  ({ rows, selectedId, onRowClick }: ShopTableProps) => {
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
                {SHOP_COLUMNS.map((col) => {
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
                const idKey = row.shopCode
                  ? String(row.shopCode).trim()
                  : String(index);
                const isSelected = selectedId === idKey;

                return (
                  <ShopTableRow
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

ShopTable.displayName = "ShopTable";
