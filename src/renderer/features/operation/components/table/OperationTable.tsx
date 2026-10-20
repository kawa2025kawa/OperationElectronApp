// src/renderer/features/operation/components/table/OperationTable.tsx

import { memo, useCallback, useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";
import * as ContextMenu from "@radix-ui/react-context-menu";

import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusContextMenu } from "@renderer/features/operation/components/contextMenu/StatusContextMenu";

import { useOperationTable } from "./useOperationTable";
import * as styles from "./operationTable.css";

interface ColumnMeta {
  readonly label: string;
  readonly width: string;
  readonly align?: keyof typeof styles.alignVariants;
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
  cycle: {
    label: "cycle",
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
} as const;

/** モードごとに表示する列の順序を定義 */
const VISIBLE_COLUMNS: Record<string, readonly string[]> = {
  operation: ["kanriNo", "scheduledTime", "workName", "jobId", "status"],
  irregular: ["kanriNo", "scheduledTime", "cycle", "workName"],
  today: ["kanriNo", "scheduledTime", "workName", "status"],
} as const;

function getOperationColumnValue(
  row: OperationViewItem,
  column: string,
): unknown {
  return column in row
    ? (row as unknown as Record<string, unknown>)[column]
    : undefined;
}
interface OperationTableRowProps {
  row: OperationViewItem;
  columns: readonly string[];
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
    const handleClick = useCallback(() => {
      onRowClick(kanriNo);
    }, [onRowClick, kanriNo]);

    const rowStateClass = isSelected
      ? styles.tableRowStates.selected
      : styles.tableRowStates.clickable;

    return (
      <tr
        className={`${styles.tableRowBase} ${rowStateClass}`}
        onClick={handleClick}
      >
        {columns.map((column) => {
          const value = getOperationColumnValue(row, column);
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

export const OperationTable = memo(() => {
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
                    const kanriNo = row.kanriNo.trim();
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

OperationTable.displayName = "OperationTable";

/** 既存コードとの後方互換性エイリアス */
export const UnifiedTable = OperationTable;
