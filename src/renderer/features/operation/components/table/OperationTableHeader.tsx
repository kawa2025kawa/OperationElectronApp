// src/renderer/features/operation/components/table/OperationTableHeader.tsx

import { memo } from "react";
import { clsx } from "clsx";

import type { OperationColumn } from "./operationTableConfig";
import {
  getOperationColumnAlignment,
  getOperationColumnMeta,
} from "./operationTableUtils";
import * as styles from "./operationTable.css";

interface OperationTableHeaderProps {
  readonly columns: readonly OperationColumn[];
}

const TableColumnGroup = memo(function TableColumnGroup({
  columns,
}: OperationTableHeaderProps) {
  return (
    <colgroup>
      {columns.map((column) => (
        <col
          key={column}
          style={{ width: getOperationColumnMeta(column).width }}
        />
      ))}
    </colgroup>
  );
});

TableColumnGroup.displayName = "TableColumnGroup";

export const OperationTableHeader = memo(function OperationTableHeader({
  columns,
}: OperationTableHeaderProps) {
  return (
    <div className={styles.headerWrapper}>
      <table className={styles.headerTable}>
        <TableColumnGroup columns={columns} />

        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className={clsx(
                  styles.thBase,
                  getOperationColumnAlignment(column),
                )}
              >
                {getOperationColumnMeta(column).label}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );
});

OperationTableHeader.displayName = "OperationTableHeader";
