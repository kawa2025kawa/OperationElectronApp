// src/renderer/features/operation/components/table/TableColumnGroup.tsx

import { memo } from "react";
import type { OperationColumn } from "./operationTableConfig";
import { getOperationColumnMeta } from "./operationTableConfig";

export interface TableColumnGroupProps {
  readonly columns: readonly OperationColumn[];
}

export const TableColumnGroup = memo(function TableColumnGroup({
  columns,
}: TableColumnGroupProps) {
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
