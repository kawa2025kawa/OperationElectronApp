import React, { useCallback } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import { useAppStore } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";
import * as styles from "./operationTable.css";
import { useOperationTable } from "./useOperationTable";

interface TableRowProps {
  kanriNo: string;
  columns: Column<OperationItem>[];
  isSelected: boolean;
  onRowClick: (kanriNo: string) => void;
}

const TableColGroup: React.FC<{
  columns: Column<OperationItem>[];
}> = React.memo(({ columns }) => (
  <colgroup>
    {columns.map((column) => (
      <col key={String(column.key)} style={{ width: column.width }} />
    ))}
  </colgroup>
));

TableColGroup.displayName = "TableColGroup";

const TableHeader: React.FC<{
  columns: Column<OperationItem>[];
}> = React.memo(({ columns }) => (
  <thead>
    <tr>
      {columns.map((column) => (
        <th
          key={String(column.key)}
          className={`${styles.thBase} ${
            styles.thAlignVariants[column.align ?? "left"]
          }`}
        >
          {column.label}
        </th>
      ))}
    </tr>
  </thead>
));

TableHeader.displayName = "TableHeader";

const UnifiedTableRow: React.FC<TableRowProps> = React.memo(
  ({ kanriNo, columns, isSelected, onRowClick }) => {
    const item = useAppStore(
      (state) =>
        (state.operationEntities[kanriNo] ??
          state.irregularEntities[kanriNo]) as OperationItem | undefined,
    );

    const handleClick = useCallback(() => {
      onRowClick(kanriNo);
    }, [kanriNo, onRowClick]);

    if (!item) {
      return null;
    }

    const rowClass = [
      styles.tableRowBase,
      isSelected
        ? styles.tableRowStates.selected
        : styles.tableRowStates.clickable,
    ].join(" ");

    const renderCell = (column: Column<OperationItem>) => {
      const alignClass = styles.tdAlignVariants[column.align ?? "left"];

      if (column.key === "status") {
        return (
          <td key="status" className={`${styles.tdBase} ${alignClass}`}>
            <StatusContextMenu kanriNo={item.kanriNo}>
              <div className={styles.statusCellWrapper}>
                <StatusBadge status={item.status ?? undefined} />
              </div>
            </StatusContextMenu>
          </td>
        );
      }

      const value = item[column.key as keyof OperationItem];

      return (
        <td
          key={String(column.key)}
          className={`${styles.tdBase} ${alignClass}`}
        >
          <span className={styles.cellText}>
            {value != null ? String(value) : "-"}
          </span>
        </td>
      );
    };

    return (
      <tr className={rowClass} onClick={handleClick}>
        {columns.map(renderCell)}
      </tr>
    );
  },
);

UnifiedTableRow.displayName = "UnifiedTableRow";

export const UnifiedTable: React.FC = React.memo(() => {
  const { rowIds, columns, selectedId, handleRowClick } = useOperationTable();

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <table className={styles.headerTable}>
          <TableColGroup columns={columns} />
          <TableHeader columns={columns} />
        </table>
      </div>

      <div className={styles.bodyWrapper}>
        <table className={styles.bodyTable}>
          <TableColGroup columns={columns} />

          <tbody>
            {rowIds.map((id) => (
              <UnifiedTableRow
                key={id}
                kanriNo={id}
                columns={columns}
                isSelected={selectedId === id}
                onRowClick={handleRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

UnifiedTable.displayName = "UnifiedTable";

export default UnifiedTable;
