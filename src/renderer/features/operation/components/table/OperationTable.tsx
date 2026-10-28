// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo } from "react";
import { AnimatePresence, m } from "framer-motion";

import { useOperationTable } from "./useOperationTable";
import { OperationTableHeader } from "./OperationTableHeader";
import { OperationTableBody } from "./OperationTableBody";
import { EMPTY_OPERATION_ROWS } from "./operationTableConfig";
import { getVisibleOperationColumns } from "./operationTableUtils";
import * as styles from "./operationTable.css";

export const OperationTable = memo(function OperationTable() {
  const { currentMode, rows, selectedId, handleRowClick, handleMarkSuccess } =
    useOperationTable();

  const columns = getVisibleOperationColumns(currentMode);
  const tableRows = rows ?? EMPTY_OPERATION_ROWS;

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
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
          <OperationTableHeader columns={columns} />

          <OperationTableBody
            rows={tableRows}
            columns={columns}
            selectedId={selectedId}
            onRowClick={handleRowClick}
            onMarkSuccess={handleMarkSuccess}
          />
        </m.div>
      </AnimatePresence>
    </div>
  );
});

OperationTable.displayName = "OperationTable";

/** 既存コードとの後方互換性エイリアス */
export const UnifiedTable = OperationTable;
