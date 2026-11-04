// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo } from "react";

import { useOperationTable } from "./useOperationTable";
import { OperationTableHeader } from "./OperationTableHeader";
import { OperationTableBody } from "./OperationTableBody";
import {
  EMPTY_OPERATION_ROWS,
  getVisibleOperationColumns,
} from "./operationTableConfig";
import * as styles from "./operationTable.css";

export const OperationTable = memo(function OperationTable() {
  const { currentMode, rows, selectedId, handleRowClick, handleMarkSuccess } =
    useOperationTable();

  const columns = getVisibleOperationColumns(currentMode);
  const tableRows = rows ?? EMPTY_OPERATION_ROWS;

  return (
    <div className={styles.container}>
      <div className={styles.modeContent}>
        <OperationTableHeader columns={columns} />

        <OperationTableBody
          rows={tableRows}
          columns={columns}
          selectedId={selectedId}
          onRowClick={handleRowClick}
          onMarkSuccess={handleMarkSuccess}
        />
      </div>
    </div>
  );
});

OperationTable.displayName = "OperationTable";
