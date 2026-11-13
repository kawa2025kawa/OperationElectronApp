// src/renderer/features/operation/hooks/useOperationViewLogic.ts

import { useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

import type { OperationViewItem } from "@shared/types/operation/operationTypes";

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

  return {
    currentMode,
    selectedId,
    selectedItem,
    status,
    setMode,
  };
}
