// src/renderer/features/operation/components/table/OperationTableRow.tsx

import { memo, useCallback, type KeyboardEvent } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { clsx } from "clsx";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

import type { OperationColumn } from "./operationTableConfig";
import {
  getOperationCellDisplayValue,
  getOperationColumnAlignment,
} from "./operationTableUtils";
import * as styles from "./operationTable.css";

interface OperationTableRowProps {
  readonly row: OperationViewItem;
  readonly columns: readonly OperationColumn[];
  readonly isSelected: boolean;
  readonly kanriNo: string;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
}

function isStatusChangeDisabled(status: JobStatus | undefined): boolean {
  return status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING;
}

export const OperationTableRow = memo(function OperationTableRow({
  row,
  columns,
  isSelected,
  kanriNo,
  onRowClick,
  onMarkSuccess,
}: OperationTableRowProps) {
  const handleClick = useCallback(() => {
    onRowClick(kanriNo);
  }, [kanriNo, onRowClick]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      onMarkSuccess(kanriNo);
    },
    [kanriNo, onMarkSuccess],
  );

  const rowStateClass = isSelected
    ? styles.tableRowStates.selected
    : styles.tableRowStates.clickable;

  return (
    <tr
      tabIndex={0}
      className={clsx(styles.tableRowBase, rowStateClass)}
      style={{ outline: "none" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {columns.map((column) => {
        const alignmentClass = getOperationColumnAlignment(column);

        if (column === "status") {
          const currentStatus = row.status as JobStatus | undefined;

          return (
            <td key={column} className={clsx(styles.tdBase, alignmentClass)}>
              <ContextMenu.Root>
                <ContextMenu.Trigger
                  asChild
                  disabled={isStatusChangeDisabled(currentStatus)}
                >
                  <div className={styles.statusCellWrapper}>
                    <StatusBadge status={currentStatus} />
                  </div>
                </ContextMenu.Trigger>

                <StatusContextMenu kanriNo={kanriNo} />
              </ContextMenu.Root>
            </td>
          );
        }

        return (
          <td key={column} className={clsx(styles.tdBase, alignmentClass)}>
            <span className={styles.cellText}>
              {getOperationCellDisplayValue(row, column)}
            </span>
          </td>
        );
      })}
    </tr>
  );
});

OperationTableRow.displayName = "OperationTableRow";
