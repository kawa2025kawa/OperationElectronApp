// src/renderer/features/operation/components/table/OperationTableBody.tsx

import { memo } from "react";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import type { OperationColumn } from "./operationTableConfig";
import { OperationTableRow } from "./OperationTableRow";
import { getOperationColumnMeta } from "./operationTableUtils";
import * as styles from "./operationTable.css";

const EMPTY_CELL_HEIGHT = "240px";

interface OperationTableBodyProps {
  readonly rows: readonly OperationViewItem[];
  readonly columns: readonly OperationColumn[];
  readonly selectedId: string | null | undefined;
  readonly onRowClick: (kanriNo: string) => void;
  readonly onMarkSuccess: (kanriNo: string) => void;
}

const TableColumnGroup = memo(function TableColumnGroup({
  columns,
}: Pick<OperationTableBodyProps, "columns">) {
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

export const OperationTableBody = memo(function OperationTableBody({
  rows,
  columns,
  selectedId,
  onRowClick,
  onMarkSuccess,
}: OperationTableBodyProps) {
  return (
    <div className={styles.bodyWrapper}>
      <table className={styles.bodyTable}>
        <TableColumnGroup columns={columns} />

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                style={{
                  height: EMPTY_CELL_HEIGHT,
                  verticalAlign: "middle",
                }}
              >
                <EmptyState />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const kanriNo = row.kanriNo.trim();

              return (
                <OperationTableRow
                  key={`${kanriNo}-${index}`}
                  row={row}
                  columns={columns}
                  isSelected={selectedId === kanriNo}
                  kanriNo={kanriNo}
                  onRowClick={onRowClick}
                  onMarkSuccess={onMarkSuccess}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

OperationTableBody.displayName = "OperationTableBody";
