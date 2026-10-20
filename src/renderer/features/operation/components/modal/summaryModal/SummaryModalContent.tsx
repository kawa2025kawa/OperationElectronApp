// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import { memo } from "react";
import { clsx } from "clsx";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Column } from "@shared/types/table/tableType";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";

import { useSummaryModalContent } from "./useSummaryModalContent";
import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items?: SummaryDetailRow[];
}

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

function getSummaryCellValue(item: SummaryDetailRow, key: string): unknown {
  switch (key) {
    case "kanriNo":
      return item.kanriNo;
    case "workName":
      return item.workName;
    case "jobId":
      return item.jobId;
    case "status":
      return item.status;
    case "comment":
      return item.comment;
    default:
      return undefined;
  }
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
        const rawValue = getSummaryCellValue(item, key);
        const displayValue =
          rendered ?? (rawValue != null ? String(rawValue) : "-");

        return (
          <td key={key} className={clsx(styles.tdBase, alignClass)}>
            {rendered ? (
              displayValue
            ) : (
              <span className={styles.cellText}>{displayValue}</span>
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
);

TableRow.displayName = "SummaryTableRow";

export const SummaryModalContent: GlobalModalComponent<SummaryModalContentProps> =
  memo((props) => {
    const items = props?.items ?? [];
    const { state } = useSummaryModalContent(items);

    if (state.isEmpty) {
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
              <TableColGroup columns={state.columns} />
              <tbody>
                {state.items.map((item, index) => {
                  const key = item.kanriNo || String(index);

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

SummaryModalContent.displayName = "SummaryModalContent";
