// src/renderer/features/operation/components/table/useOperationTable.ts

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type UIEvent,
} from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

export function useOperationTable() {
  const {
    currentView,
    currentMode,
    searchTerm,
    setSelectedId,
    tableRows,
    tableRowsMode,
    tableRowsByMode,
    isLoading,
    fetchTableData,
    updateOperationStatus,
    setScrollPosition,
  } = useAppStore(
    useShallow((state) => ({
      currentView: state.currentView,
      currentMode: state.currentMode,
      searchTerm: state.searchTerm,
      setSelectedId: state.setSelectedId,
      tableRows: state.tableRows,
      tableRowsMode: state.tableRowsMode,
      tableRowsByMode: state.tableRowsByMode,
      isLoading: state.isTableLoading,
      fetchTableData: state.fetchTableData,
      updateOperationStatus: state.updateOperationStatus,
      setScrollPosition: state.setScrollPosition,
    })),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const restoredScrollKeyRef = useRef<string | null>(null);
  const previousSearchTermRef = useRef("");

  const scrollKey = `${currentView}:${currentMode}`;

  // データ取得

  useEffect(() => {
    const hasCache = (tableRowsByMode[currentMode]?.length ?? 0) > 0;

    if (tableRowsMode !== currentMode) {
      if (hasCache) {
        void fetchTableData(currentMode, false);
      } else {
        void fetchTableData(currentMode).catch((error: unknown) => {
          console.error("[OperationTable] Failed to load table data:", error);
        });
      }
    }
  }, [currentMode, tableRowsMode, tableRowsByMode, fetchTableData]);

  // 表示対象データ（切り替え直後の前モードデータ混入を防止）

  const rows = useMemo(() => {
    if (tableRowsMode === currentMode) {
      return tableRows;
    }

    return tableRowsByMode[currentMode] ?? [];
  }, [tableRowsMode, currentMode, tableRows, tableRowsByMode]);

  const isSwitchingMode =
    isLoading || (tableRowsMode !== currentMode && rows.length === 0);

  // 行選択

  const handleRowClick = useCallback(
    (kanriNo: string) => setSelectedId(currentMode, kanriNo),
    [currentMode, setSelectedId],
  );

  // ステータス更新

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

  // 再取得

  const refetch = useCallback(
    () => fetchTableData(currentMode, true),
    [currentMode, fetchTableData],
  );

  // スクロール位置復元

  const restoreScrollPosition = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const position = useAppStore.getState().scrollPositions[scrollKey];

    container.scrollTop = position?.top ?? 0;
    container.scrollLeft = position?.left ?? 0;
  }, [scrollKey]);

  const restoreInitialScrollPosition = useCallback(
    (hasVisibleRows: boolean) => {
      if (
        restoredScrollKeyRef.current === scrollKey ||
        tableRowsMode !== currentMode ||
        !hasVisibleRows
      ) {
        return;
      }

      restoreScrollPosition();
      restoredScrollKeyRef.current = scrollKey;
    },
    [scrollKey, currentMode, tableRowsMode, restoreScrollPosition],
  );

  // 検索解除時のスクロール位置復元

  useLayoutEffect(() => {
    const previousSearchTerm = previousSearchTermRef.current;
    previousSearchTermRef.current = searchTerm;

    if (!previousSearchTerm || searchTerm) return;

    restoreScrollPosition();
  }, [searchTerm, rows, restoreScrollPosition]);

  // スクロール位置保存

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (searchTerm) return;

      const { scrollTop, scrollLeft } = event.currentTarget;

      setScrollPosition(scrollKey, {
        top: scrollTop,
        left: scrollLeft,
      });
    },
    [searchTerm, scrollKey, setScrollPosition],
  );

  return {
    currentView,
    currentMode,
    rows,
    searchTerm,
    isLoading: isSwitchingMode,
    containerRef,
    handleScroll,
    handleRowClick,
    handleMarkSuccess,
    restoreInitialScrollPosition,
    refetch,
  };
}
