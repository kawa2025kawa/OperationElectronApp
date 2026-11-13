// src/renderer/features/operation/components/modal/summaryModal/SummaryModalContent.tsx

import { memo, useMemo } from "react";
import { clsx } from "clsx";
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";

import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { SummaryDetailRow } from "@shared/types/statusSummary/statusSummaryTypes";
import type { JobStatus } from "@shared/types/operation/operationTypes";
import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/utils/operationDisplayUtils";

import * as styles from "./summaryModalContent.css";

interface SummaryModalContentProps {
  items?: SummaryDetailRow[];
}

const SUMMARY_TABLE_FEATURES = tableFeatures({});
type SummaryTableFeaturesType = typeof SUMMARY_TABLE_FEATURES;

interface SummaryColumnMeta {
  readonly width: string;
  readonly align?: keyof typeof styles.alignVariants;
}

const EMPTY_SUMMARY_ITEMS: SummaryDetailRow[] = [];

function renderSummaryCell(value: unknown, exists = true) {
  const displayValue = exists
    ? toDisplayValue(value)
    : toMissingPropertyDisplayValue();

  return <span className={styles.cellText}>{displayValue}</span>;
}

const SUMMARY_COLUMNS: ColumnDef<SummaryTableFeaturesType, SummaryDetailRow>[] = [
  {
    id: "kanriNo",
    header: "管理No",
    meta: { width: "15%", align: "left" } satisfies SummaryColumnMeta,
    accessorFn: (row) => row.kanriNo,
    cell: (info) => renderSummaryCell(info.getValue()),
  },
  {
    id: "workName",
    header: "作業名",
    meta: { width: "55%", align: "left" } satisfies SummaryColumnMeta,
    accessorFn: (row) => row.workName,
    cell: (info) => renderSummaryCell(info.getValue()),
  },
  {
    id: "jobId",
    header: "Job ID",
    meta: { width: "15%", align: "left" } satisfies SummaryColumnMeta,
    accessorFn: (row) => row.jobId,
    cell: (info) =>
      renderSummaryCell(info.getValue(), "jobId" in info.row.original),
  },
  {
    id: "status",
    header: "ステータス",
    meta: { width: "15%", align: "center" } satisfies SummaryColumnMeta,
    accessorFn: (row) => row.status,
    cell: (info) => (
      <StatusBadge status={info.getValue<JobStatus | undefined>()} />
    ),
  },
];

export const SummaryModalContent: GlobalModalComponent<SummaryModalContentProps> =
  memo((props) => {
    const rawItems = props?.items;
    const items = useMemo(
      () => (Array.isArray(rawItems) ? rawItems : EMPTY_SUMMARY_ITEMS),
      [rawItems],
    );

    const table = useTable({
      features: SUMMARY_TABLE_FEATURES,
      columns: SUMMARY_COLUMNS,
      data: items,
      getRowId: (row, index) => row.kanriNo || String(index),
    });

    if (items.length === 0) {
      return (
        <div className={styles.container}>
          <EmptyState />
        </div>
      );
    }

    const leafColumns = table.getAllLeafColumns();
    const tableRows = table.getRowModel().rows;

    return (
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <div className={styles.headerWrapper}>
            <table className={styles.headerTable}>
              <colgroup>
                {leafColumns.map((col) => {
                  const meta = col.columnDef.meta as SummaryColumnMeta | undefined;
                  return (
                    <col
                      key={col.id}
                      style={{ width: meta?.width ?? "auto" }}
                    />
                  );
                })}
              </colgroup>
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      const meta = header.column.columnDef.meta as
                        | SummaryColumnMeta
                        | undefined;
                      const align = meta?.align ?? "left";
                      const alignClass =
                        styles.alignVariants[align] ?? styles.alignVariants.left;

                      return (
                        <th
                          key={header.id}
                          className={clsx(styles.thBase, alignClass)}
                        >
                          {header.isPlaceholder ? null : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
            </table>
          </div>

          <div className={styles.bodyWrapper}>
            <table className={styles.bodyTable}>
              <colgroup>
                {leafColumns.map((col) => {
                  const meta = col.columnDef.meta as SummaryColumnMeta | undefined;
                  return (
                    <col
                      key={col.id}
                      style={{ width: meta?.width ?? "auto" }}
                    />
                  );
                })}
              </colgroup>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.id}
                    className={clsx(
                      styles.tableRowBase,
                      styles.tableRowStates.idle,
                    )}
                  >
                    {row.getAllCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | SummaryColumnMeta
                        | undefined;
                      const align = meta?.align ?? "left";
                      const alignClass =
                        styles.alignVariants[align] ?? styles.alignVariants.left;

                      return (
                        <td
                          key={cell.id}
                          className={clsx(styles.tdBase, alignClass)}
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  });

SummaryModalContent.displayName = "SummaryModalContent";
