import React, { useCallback } from "react";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { useAppStore } from "@shared/store";
import type { Column } from "@shared/types/tableType";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import type { OperationItem } from "@shared/types/operationType";
import * as styles from "./operationTable.css";
import { useOperationTable } from "./useOperationTable";

interface UnifiedTableRowProps {
  kanriNo: string;
  columns: Column<OperationItem>[];
  isSelected: boolean;
  onRowClick: (kanriNo: string) => void;
}

const UnifiedTableRow: React.FC<UnifiedTableRowProps> = React.memo(
  ({ kanriNo, columns, isSelected, onRowClick }) => {
    const item = useAppStore(
      (state) =>
        (state.operationEntities[kanriNo] ??
          state.irregularEntities[kanriNo]) as OperationItem | undefined,
    );

    const handleClick = useCallback(() => {
      onRowClick(kanriNo);
    }, [kanriNo, onRowClick]);

    if (!item) return null;

    const rowStateClass = isSelected
      ? styles.tableRowStates.selected
      : styles.tableRowStates.clickable;

    return (
      <tr
        className={`${styles.tableRowBase} ${rowStateClass}`}
        onClick={handleClick}
      >
        {columns.map((column) => {
          if (column.key === "status") {
            return (
              <td
                key="status"
                className={`${styles.tdBase} ${styles.tdAlignVariants.left}`}
              >
                <StatusContextMenu kanriNo={item.kanriNo}>
                  <div className={styles.statusCellWrapper}>
                    <StatusBadge status={item.status ?? undefined} />
                  </div>
                </StatusContextMenu>
              </td>
            );
          }

          const rawValue = item[column.key as keyof OperationItem];
          const alignKey = column.align ?? "left";
          const alignClass = styles.tdAlignVariants[alignKey] ?? "";

          return (
            <td
              key={String(column.key)}
              className={`${styles.tdBase} ${alignClass}`}
            >
              <span className={styles.cellText}>
                {rawValue != null ? String(rawValue) : "-"}
              </span>
            </td>
          );
        })}
      </tr>
    );
  },
);

UnifiedTableRow.displayName = "UnifiedTableRow";

export const UnifiedTable: React.FC = React.memo(() => {
  const { rowIds, columns, selectedId, handleRowClick } = useOperationTable();

  const renderRow = useCallback(
    (id: string) => (
      <UnifiedTableRow
        key={id}
        kanriNo={id}
        columns={columns}
        isSelected={selectedId === id}
        onRowClick={handleRowClick}
      />
    ),
    [columns, selectedId, handleRowClick],
  );

  return (
    <div className={styles.container}>
      <div className={styles.bodyWrapper}>
        <table className={styles.tableStyle}>
          <thead>
            <tr>
              {columns.map((column) => {
                const alignKey = column.align ?? "left";
                const alignClass = styles.thAlignVariants[alignKey] ?? "";
                return (
                  <th
                    key={String(column.key)}
                    className={`${styles.thBase} ${alignClass}`}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{rowIds.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
});

UnifiedTable.displayName = "UnifiedTable";

export default UnifiedTable;
