// src/renderer/features/operation/components/table/useOperationTable.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import { selectFilteredTableRows } from "@renderer/store/selectors/operationSelectors";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

/**
 * 運用テーブルの表示データ、選択状態、操作ハンドラーを提供するフック
 */
export function useOperationTable() {
  const {
    currentMode,
    selectedId,
    searchTerm,
    setSelectedId,
    tableRows,
    tableRowsMode,
    isLoading,
    fetchTableData,
    updateOperationStatus,
  } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      selectedId: state.selectedIds[state.currentMode] ?? "",
      searchTerm: state.searchTerm,
      setSelectedId: state.setSelectedId,
      tableRows: state.tableRows,
      tableRowsMode: state.tableRowsMode,
      isLoading: state.isTableLoading,
      fetchTableData: state.fetchTableData,
      updateOperationStatus: state.updateOperationStatus,
    })),
  );

  useEffect(() => {
    if (tableRowsMode !== currentMode) {
      void fetchTableData(currentMode).catch((error: unknown) => {
        console.error("[OperationTable] Failed to load table data:", error);
      });
    }
  }, [currentMode, tableRowsMode, fetchTableData]);

  const rows = useMemo(
    () => selectFilteredTableRows(tableRows, searchTerm),
    [tableRows, searchTerm],
  );

  const handleRowClick = useCallback(
    (kanriNo: string) => {
      setSelectedId(currentMode, kanriNo);
    },
    [currentMode, setSelectedId],
  );

  const handleMarkSuccess = useCallback(
    (kanriNo: string) => {
      updateOperationStatus({
        kanriNo,
        status: JOB_STATUS.SUCCESS,
        comment: "",
      });
    },
    [updateOperationStatus],
  );

  const refetch = useCallback(
    () => fetchTableData(currentMode),
    [currentMode, fetchTableData],
  );

  return {
    currentMode,
    rows,
    selectedId,
    isLoading,
    handleRowClick,
    handleMarkSuccess,
    refetch,
  };
}
