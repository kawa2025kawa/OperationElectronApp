// src/renderer/features/operation/OperationView.tsx

import { memo, useCallback, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";

import { OperationTable } from "@renderer/features/operation/components/table/OperationTable";
import { VIEW_MODES, type ViewMode } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";
import {
  selectMergedOperationAndTodayRows,
  selectRowsForMode,
} from "@renderer/store/slices/operationStatusSlice";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

import { OperationActionMenu } from "./components/operationActionMenu/OperationActionMenu";
import { OperationInfoRow } from "./components/operationInfoRow/OperationInfoRow";
import { OperationModeSwitcher } from "./components/operationModeSwitcher/OperationModeSwitcher";
import { createInfoRows } from "./utils/operationDisplayUtils";
import * as styles from "./operationView.css";

export const OperationView = memo(function OperationView() {
  const {
    currentMode,
    setMode,
    selectedId,
    summaryStatusFilter,
    tableRows,
    tableRowsMode,
    tableRowsByMode,
  } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      setMode: state.setMode,
      selectedId: state.selectedIds[state.currentMode] ?? "",
      summaryStatusFilter: state.summaryStatusFilter,
      tableRows: state.tableRows,
      tableRowsMode: state.tableRowsMode,
      tableRowsByMode: state.tableRowsByMode,
    })),
  );

  const [, startTransition] = useTransition();

  const isSummaryFilterActive =
    currentMode !== VIEW_MODES.IRREGULAR && summaryStatusFilter !== null;

  const rows = useMemo(
    () =>
      isSummaryFilterActive
        ? selectMergedOperationAndTodayRows({
            tableRows,
            tableRowsMode,
            tableRowsByMode,
          })
        : selectRowsForMode(
            { tableRows, tableRowsMode, tableRowsByMode },
            currentMode,
          ),
    [
      isSummaryFilterActive,
      tableRows,
      tableRowsMode,
      tableRowsByMode,
      currentMode,
    ],
  );

  const selectedItem = useMemo(() => {
    const targetId = selectedId.trim();
    return targetId
      ? rows.find((row) => row.kanriNo.trim() === targetId)
      : undefined;
  }, [rows, selectedId]);

  const status = selectedItem?.status ?? JOB_STATUS.SCHEDULED;

  const infoRows = useMemo(
    () =>
      createInfoRows(
        isSummaryFilterActive ? VIEW_MODES.TODAY : currentMode,
        selectedItem,
        status,
      ),
    [isSummaryFilterActive, currentMode, selectedItem, status],
  );

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      startTransition(() => {
        setMode(mode);
      });
    },
    [setMode],
  );

  return (
    <div className={styles.container}>
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <OperationTable />
        </div>
      </div>

      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          <div className={styles.topControls}>
            <OperationModeSwitcher
              currentMode={currentMode}
              onModeChange={handleModeChange}
            />

            <OperationActionMenu selectedItem={selectedItem} />
          </div>

          <div
            key={selectedId || "empty"}
            data-operation-info-list="true"
            className={styles.infoList}
          >
            {infoRows.map((row) => (
              <OperationInfoRow key={row.field} {...row} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";