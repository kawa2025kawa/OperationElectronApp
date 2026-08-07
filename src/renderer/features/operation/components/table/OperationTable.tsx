// src/renderer/features/operation/components/table/OperationTable.tsx
import React, { useCallback } from "react";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";
import type { ViewMode } from "@shared/types/uiType";
import { useAppStore } from "@shared/store";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import { useOperationTable } from "./useOperationTable";
import * as styles from "./operationTable.css";

interface UnifiedTableRowProps {
  kanriNo: string;
  columns: Column<OperationItem>[];
  isSelected: boolean;
  currentMode: ViewMode;
  onRowClick: (kanriNo: string) => void;
}

const UnifiedTableRow: React.FC<UnifiedTableRowProps> = React.memo(
  ({ kanriNo, columns, isSelected, currentMode, onRowClick }) => {
    const item = useAppStore(
      (s) =>
        (s.operationEntities[kanriNo] ?? s.irregularEntities[kanriNo]) as
          | OperationItem
          | undefined,
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
        {columns.map((col) => {
          if (col.key === "status" && currentMode === "operation") {
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

          const rawValue = col.key
            ? item[col.key as keyof OperationItem]
            : undefined;
          const alignKey = col.align ?? "left";
          const alignClass = styles.tdAlignVariants[alignKey] ?? "";

          return (
            <td
              key={String(col.key)}
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
  const { currentMode, rowIds, columns, selectedId, handleRowClick } =
    useOperationTable();

  const renderRow = useCallback(
    (id: string) => (
      <UnifiedTableRow
        key={id}
        kanriNo={id}
        columns={columns}
        isSelected={selectedId === id}
        currentMode={currentMode}
        onRowClick={handleRowClick}
      />
    ),
    [columns, selectedId, currentMode, handleRowClick],
  );

  return (
    <div className={styles.container}>
      <div className={styles.bodyWrapper}>
        <table className={styles.tableStyle}>
          <thead>
            <tr>
              {columns.map((col) => {
                const alignKey = col.align ?? "left";
                const alignClass = styles.thAlignVariants[alignKey] ?? "";
                return (
                  <th
                    key={String(col.key)}
                    className={`${styles.thBase} ${alignClass}`}
                    style={{ width: col.width }}
                  >
                    {col.label}
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
