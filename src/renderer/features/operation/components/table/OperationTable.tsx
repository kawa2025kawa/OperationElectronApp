import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";
import { UnifiedTableRow } from "./UnifiedTableRow";
import { useOperationTable } from "./useOperationTable";
import * as styles from "./operationTable.css";

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

export const UnifiedTable: React.FC = React.memo(() => {
  const { currentMode, rowIds, columns, selectedId, handleRowClick } =
    useOperationTable();

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{
            duration: 0.12,
            ease: "easeOut",
          }}
          className={styles.modeContent}
        >
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

UnifiedTable.displayName = "UnifiedTable";

export default UnifiedTable;
