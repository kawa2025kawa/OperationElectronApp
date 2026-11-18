// src/renderer/features/operation/hooks/useOperationViewLogic.ts

import { useCallback, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
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
    tableRows,
    tableRowsMode,
    tableRowsByMode,
  } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      setMode: state.setMode,
      selectedId: state.selectedIds[state.currentMode] ?? "",
      tableRows: state.tableRows,
      tableRowsMode: state.tableRowsMode,
      tableRowsByMode: state.tableRowsByMode,
    })),
  );

  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    if (rowsInput) {
      return rowsInput;
    }

    if (tableRowsMode === currentMode) {
      return tableRows;
    }

    return tableRowsByMode[currentMode] ?? [];
  }, [rowsInput, tableRowsMode, currentMode, tableRows, tableRowsByMode]);

  const selectedItem = useMemo(() => {
    const targetId = selectedId.trim();
    if (!targetId) {
      return undefined;
    }

    return rows.find((row) => row.kanriNo.trim() === targetId);
  }, [rows, selectedId]);

  const status = selectedItem?.status ?? JOB_STATUS.SCHEDULED;

  const infoRows = useMemo(
    () => createInfoRows(currentMode, selectedItem, status),
    [currentMode, selectedItem, status],
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