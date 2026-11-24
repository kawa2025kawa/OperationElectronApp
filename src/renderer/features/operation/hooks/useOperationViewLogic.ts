// src/renderer/features/operation/hooks/useOperationViewLogic.ts

import { useCallback, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import {
  selectMergedOperationAndTodayRows,
  selectRowsForMode,
} from "@renderer/store/slices/operationStatusSlice";
import {
  JOB_STATUS,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import { createInfoRows } from "../utils/operationDisplayUtils";

export function useOperationViewLogic(rowsInput?: OperationViewItem[]) {
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
    currentMode !== "irregular" && summaryStatusFilter !== null;

  const rows = useMemo(
    () =>
      rowsInput ??
      (isSummaryFilterActive
        ? selectMergedOperationAndTodayRows({
            tableRows,
            tableRowsMode,
            tableRowsByMode,
          })
        : selectRowsForMode(
            { tableRows, tableRowsMode, tableRowsByMode },
            currentMode,
          )),
    [
      rowsInput,
      isSummaryFilterActive,
      tableRows,
      tableRowsMode,
      tableRowsByMode,
      currentMode,
    ],
  );

  const selectedItem = useMemo(() => {
    const targetId = selectedId.trim();
    if (!targetId) {
      return undefined;
    }

    return rows.find((row) => row.kanriNo.trim() === targetId);
  }, [rows, selectedId]);

  const status = selectedItem?.status ?? JOB_STATUS.SCHEDULED;

  const infoRows = useMemo(
    () =>
      createInfoRows(
        isSummaryFilterActive ? "today" : currentMode,
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

  return {
    currentMode,
    selectedId,
    selectedItem,
    infoRows,
    handleModeChange,
  };
}
