// src/renderer/features/operation/components/table/useOperationTable.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useAppStore } from "@renderer/store";
import { selectFilteredTableRows } from "@renderer/features/operation/store/operationSelectors";
import { useTableHotkeys } from "./useOperationTableHotkeys";

export const useOperationTable = () => {
  const {
    currentMode,
    selectedId,
    searchTerm,
    setSelectedId,
    tableRows,
    isLoading,
    fetchTableData,
  } = useAppStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      selectedId: state.selectedIds[state.currentMode] ?? "",
      searchTerm: state.searchTerm,
      setSelectedId: state.setSelectedId,
      tableRows: state.tableRows,
      isLoading: state.isTableLoading,
      fetchTableData: state.fetchTableData,
    })),
  );

  // モード切り替え時および初回表示時のデータフェッチ
  useEffect(() => {
    void fetchTableData(currentMode);
  }, [currentMode, fetchTableData]);

  // キーワードフィルタリング
  const rows = useMemo(
    () => selectFilteredTableRows(tableRows, searchTerm),
    [tableRows, searchTerm],
  );

  const rowIds = useMemo(() => rows.map((row) => row.kanriNo), [rows]);

  const handleRowClick = useCallback(
    (id: string) => {
      setSelectedId(currentMode, id);
    },
    [currentMode, setSelectedId],
  );

  // ホットキー制御
  useTableHotkeys(currentMode, rowIds, selectedId, handleRowClick);

  return {
    currentMode,
    rows,
    selectedId,
    isLoading,
    handleRowClick,
    refetch: () => fetchTableData(currentMode),
  };
};
