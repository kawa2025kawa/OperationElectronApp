//src\renderer\features\operation\components\modal\summaryModal\SummaryModalContent.tsx

import { memo } from "react";
import { clsx } from "clsx";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Column } from "@shared/types/table/tableType";

import {
  type SummaryRow,
  useSummaryModalContent,
} from "./useSummaryModalContent";
import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items: SummaryRow[];
}

interface TableColGroupProps<T extends object> {
  columns: readonly Column<T>[];
}

const TableColGroup = <T extends object>({
  columns,
}: TableColGroupProps<T>) => (
  <colgroup>
    {columns.map((column) => (
      <col key={String(column.key)} style={{ width: column.width }} />
    ))}
  </colgroup>
);

interface TableRowProps<T extends object> {
  item: T;
  columns: readonly Column<T>[];
  isSelected: boolean;
  onRowClick?: (item: T) => void;
}

const TableRowInner = <T extends object>({
  item,
  columns,
  isSelected,
  onRowClick,
}: TableRowProps<T>) => {
  const rowState = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  const handleClick = () => {
    onRowClick?.(item);
  };

  return (
    <tr
      onClick={handleClick}
      className={clsx(styles.tableRowBase, styles.tableRowStates[rowState])}
    >
      {columns.map((column) => {
        const key = String(column.key);
        const align = column.align ?? "left";

        const value = column.render
          ? column.render(item)
          : getValueByPath(item as unknown as Record<string, unknown>, key);

        const title =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : undefined;

        return (
          <td
            key={key}
            title={title}
            className={clsx(styles.tdBase, styles.tdAlignVariants[align])}
          >
            {column.render ? (
              value
            ) : (
              <span className={styles.cellText}>{String(value ?? "-")}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};

const TableRow = memo(
  TableRowInner,
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.item === next.item &&
    prev.onRowClick === next.onRowClick,
) as typeof TableRowInner;

export const SummaryModalContent: GlobalModalComponent<SummaryModalContentProps> =
  memo(({ items }) => {
    const { state } = useSummaryModalContent(items);

    if (state.items.length === 0) {
      return (
        <div className={styles.container}>
          <EmptyState />
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <div className={styles.headerWrapper}>
            <table className={styles.headerTable}>
              <TableColGroup columns={state.columns} />

              <thead>
                <tr>
                  {state.columns.map((column) => {
                    const align = column.align ?? "left";

                    return (
                      <th
                        key={String(column.key)}
                        className={clsx(
                          styles.thBase,
                          styles.thAlignVariants[align],
                        )}
                      >
                        {column.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
          </div>

          <div className={styles.bodyWrapper}>
            <table className={styles.bodyTable}>
              <TableColGroup columns={state.columns} />

              <tbody>
                {state.items.map((item, index) => {
                  const key =
                    "kanriNo" in item && item.kanriNo
                      ? String(item.kanriNo)
                      : String(index);

                  return (
                    <TableRow
                      key={key}
                      item={item}
                      columns={state.columns}
                      isSelected={false}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  });
