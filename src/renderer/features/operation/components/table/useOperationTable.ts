// src/renderer/features/operation/components/table/useOperationTable.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import {
  OPERATION_TABLE_SEARCH_KEYS,
  selectFilteredTableRows,
} from "@renderer/store/selectors/operationSelectors";
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
    tableRowsByMode,
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
      tableRowsByMode: state.tableRowsByMode,
      isLoading: state.isTableLoading,
      fetchTableData: state.fetchTableData,
      updateOperationStatus: state.updateOperationStatus,
    })),
  );

  useEffect(() => {
    // キャッシュがない場合のみ非同期フェッチを実行
    const hasCache = tableRowsByMode[currentMode]?.length > 0;
    if (tableRowsMode !== currentMode) {
      if (hasCache) {
        // キャッシュから即時同期展開
        void fetchTableData(currentMode, false);
      } else {
        void fetchTableData(currentMode).catch((error: unknown) => {
          console.error("[OperationTable] Failed to load table data:", error);
        });
      }
    }
  }, [currentMode, tableRowsMode, tableRowsByMode, fetchTableData]);

  // モード切り替え直後の一瞬のズレを防ぐため、現在のモードのキャッシュ行を優先
  const activeRows =
    tableRowsMode === currentMode
      ? tableRows
      : (tableRowsByMode[currentMode] ?? tableRows);

  const rows = useMemo(
    () =>
      selectFilteredTableRows(
        activeRows,
        searchTerm,
        OPERATION_TABLE_SEARCH_KEYS,
      ),
    [activeRows, searchTerm],
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
    () => fetchTableData(currentMode, true),
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
