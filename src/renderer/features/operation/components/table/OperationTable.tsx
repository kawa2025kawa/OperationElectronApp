// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo, useCallback, useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";
import * as ContextMenu from "@radix-ui/react-context-menu";

import type { JobStatus } from "@shared/types/operation/operationTypes";

import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";
import type { OperationTableRow } from "@renderer/features/operation/store/operationSelectors";

import { useOperationTable } from "./useOperationTable";
import * as styles from "./operationTable.css";

interface ColumnMeta {
  label: string;
  width: string;
  align?: keyof typeof styles.alignVariants;
}

const COLUMN_CONFIG: Record<string, ColumnMeta> = {
  kanriNo: {
    label: "管理No",
    width: "90px",
  },
  scheduledTime: {
    label: "予定時刻",
    width: "120px",
  },
  dateRule: {
    label: "日付",
    width: "100px",
    align: "center",
  },
  weekdayRule: {
    label: "曜日",
    width: "100px",
    align: "center",
  },
  weekRule: {
    label: "週",
    width: "100px",
    align: "center",
  },
  monthRule: {
    label: "月",
    width: "100px",
    align: "center",
  },
  workName: {
    label: "作業名",
    width: "auto",
  },
  jobId: {
    label: "ジョブID",
    width: "auto",
  },
  status: {
    label: "ステータス",
    width: "140px",
    align: "center",
  },
};

/** モードごとに表示する列の順序を定義 */
const VISIBLE_COLUMNS: Record<string, string[]> = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: [
    "kanriNo",
    "scheduledTime",
    "dateRule",
    "weekdayRule",
    "weekRule",
    "monthRule",
    "workName",
  ],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
};

interface OperationTableRowProps {
  row: OperationTableRow;
  columns: string[];
  isSelected: boolean;
  onRowClick: (kanriNo: string) => void;
  kanriNo: string;
}

const OperationTableRow = memo(
  ({
    row,
    columns,
    isSelected,
    onRowClick,
    kanriNo,
  }: OperationTableRowProps) => {
    const record = row as unknown as Record<string, unknown>;

    const handleClick = useCallback(() => {
      onRowClick(kanriNo);
    }, [onRowClick, kanriNo]);

    const rowClass = [
      styles.tableRowBase,
      isSelected
        ? styles.tableRowStates.selected
        : styles.tableRowStates.clickable,
    ].join(" ");

    return (
      <tr className={rowClass} onClick={handleClick}>
        {columns.map((column) => {
          const value = record[column];
          const config = COLUMN_CONFIG[column];
          const alignClass = styles.alignVariants[config?.align ?? "left"];

          if (column === "status") {
            return (
              <td key={column} className={`${styles.tdBase} ${alignClass}`}>
                <ContextMenu.Root>
                  <ContextMenu.Trigger asChild>
                    <div className={styles.statusCellWrapper}>
                      <StatusBadge status={value as JobStatus | undefined} />
                    </div>
                  </ContextMenu.Trigger>

                  <StatusContextMenu kanriNo={kanriNo} />
                </ContextMenu.Root>
              </td>
            );
          }

          return (
            <td key={column} className={`${styles.tdBase} ${alignClass}`}>
              <span className={styles.cellText}>
                {value != null ? String(value) : ""}
              </span>
            </td>
          );
        })}
      </tr>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.kanriNo === next.kanriNo &&
    prev.columns === next.columns &&
    prev.row === next.row,
);

OperationTableRow.displayName = "OperationTableRow";

export const UnifiedTable = memo(() => {
  const { currentMode, rows, selectedId, handleRowClick } = useOperationTable();

  const columns = useMemo(() => {
    return (
      VISIBLE_COLUMNS[currentMode] ??
      (rows.length > 0 ? Object.keys(rows[0]) : [])
    );
  }, [rows, currentMode]);

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
          {/* 固定ヘッダーテーブル */}
          <div className={styles.headerWrapper}>
            <table className={styles.headerTable}>
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column}
                    style={{
                      width: COLUMN_CONFIG[column]?.width ?? "auto",
                    }}
                  />
                ))}
              </colgroup>

              <thead>
                <tr>
                  {columns.map((column) => {
                    const config = COLUMN_CONFIG[column];
                    const alignClass =
                      styles.alignVariants[config?.align ?? "left"];

                    return (
                      <th
                        key={column}
                        className={`${styles.thBase} ${alignClass}`}
                      >
                        {config?.label ?? column}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
          </div>

          {/* スクロール可能ボディテーブル */}
          <div className={styles.bodyWrapper}>
            <table className={styles.bodyTable}>
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column}
                    style={{
                      width: COLUMN_CONFIG[column]?.width ?? "auto",
                    }}
                  />
                ))}
              </colgroup>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length || 1}
                      style={{
                        height: "240px",
                        verticalAlign: "middle",
                      }}
                    >
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const record = row as unknown as Record<string, unknown>;

                    const kanriNo =
                      typeof record.kanriNo === "string"
                        ? record.kanriNo.trim()
                        : String(record.kanriNo ?? index);

                    const isSelected = selectedId === kanriNo;

                    return (
                      <OperationTableRow
                        key={`${kanriNo}-${index}`}
                        row={row}
                        columns={columns}
                        isSelected={isSelected}
                        onRowClick={handleRowClick}
                        kanriNo={kanriNo}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
});
