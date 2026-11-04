// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import { memo } from "react";
import { clsx } from "clsx";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Column } from "@shared/types/table/tableType";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";
import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/utils/operationDisplayUtils";
import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items?: SummaryDetailRow[];
}

const SUMMARY_COLUMNS: readonly Column<SummaryDetailRow>[] = [
  { key: "kanriNo", label: "管理No", width: "15%" },
  { key: "workName", label: "作業名", width: "55%" },
  { key: "jobId", label: "Job ID", width: "15%" },
  {
    key: "status",
    label: "ステータス",
    width: "15%",
    render: (item) => <StatusBadge status={item.status} />,
  },
];

interface TableColGroupProps {
  columns: readonly Column<SummaryDetailRow>[];
}

const TableColGroup = ({ columns }: TableColGroupProps) => (
  <colgroup>
    {columns.map((column) => (
      <col key={String(column.key)} style={{ width: column.width }} />
    ))}
  </colgroup>
);

interface TableRowProps {
  item: SummaryDetailRow;
  columns: readonly Column<SummaryDetailRow>[];
  isSelected: boolean;
  onRowClick?: (item: SummaryDetailRow) => void;
}

function getSummaryCellValue(
  item: SummaryDetailRow,
  key: string,
): { exists: boolean; value: unknown } {
  if (!Object.prototype.hasOwnProperty.call(item, key)) {
    return { exists: false, value: undefined };
  }

  return {
    exists: true,
    value: (item as unknown as Record<string, unknown>)[key],
  };
}

const TableRowInner = ({
  item,
  columns,
  isSelected,
  onRowClick,
}: TableRowProps) => {
  const rowState = isSelected ? "selected" : onRowClick ? "clickable" : "idle";

  return (
    <tr
      onClick={() => onRowClick?.(item)}
      className={clsx(styles.tableRowBase, styles.tableRowStates[rowState])}
    >
      {columns.map((column) => {
        const key = String(column.key);
        const align = column.align ?? "left";
        const alignClass =
          styles.alignVariants[align] ?? styles.alignVariants.left;
        const rendered = column.render ? column.render(item) : null;

        if (rendered != null) {
          return (
            <td key={key} className={clsx(styles.tdBase, alignClass)}>
              {rendered}
            </td>
          );
        }

        const cell = getSummaryCellValue(item, key);
        const displayValue = cell.exists
          ? toDisplayValue(cell.value)
          : toMissingPropertyDisplayValue();

        return (
          <td key={key} className={clsx(styles.tdBase, alignClass)}>
            <span className={styles.cellText}>{displayValue}</span>
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
);

TableRow.displayName = "SummaryTableRow";

export const SummaryModalContent: GlobalModalComponent<SummaryModalContentProps> =
  memo((props) => {
    const items = props?.items ?? [];

    if (items.length === 0) {
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
              <TableColGroup columns={SUMMARY_COLUMNS} />
              <thead>
                <tr>
                  {SUMMARY_COLUMNS.map((column) => {
                    const align = column.align ?? "left";
                    const alignClass =
                      styles.alignVariants[align] ?? styles.alignVariants.left;

                    return (
                      <th
                        key={String(column.key)}
                        className={clsx(styles.thBase, alignClass)}
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
              <TableColGroup columns={SUMMARY_COLUMNS} />
              <tbody>
                {items.map((item, index) => {
                  const key = item.kanriNo || String(index);

                  return (
                    <TableRow
                      key={key}
                      item={item}
                      columns={SUMMARY_COLUMNS}
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

SummaryModalContent.displayName = "SummaryModalContent";
