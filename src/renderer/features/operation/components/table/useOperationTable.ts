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
import {
  OPERATION_TABLE_SEARCH_KEYS,
  selectFilteredTableRows,
} from "@renderer/store/selectors/operationSelectors";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

/**
 * 運用テーブルのデータ・状態・操作・スクロール制御を提供するフック
 */
export function useOperationTable() {
  const {
    currentView,
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
    setScrollPosition,
  } = useAppStore(
    useShallow((state) => ({
      currentView: state.currentView,
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

  // 表示行の絞り込み
  const rows = useMemo(() => {
    const activeRows =
      tableRowsMode === currentMode
        ? tableRows
        : (tableRowsByMode[currentMode] ?? tableRows);

    return selectFilteredTableRows(
      activeRows,
      searchTerm,
      OPERATION_TABLE_SEARCH_KEYS,
    );
  }, [tableRowsMode, currentMode, tableRows, tableRowsByMode, searchTerm]);

  // 行選択
  const handleRowClick = useCallback(
    (kanriNo: string) => {
      setSelectedId(currentMode, kanriNo);
    },
    [currentMode, setSelectedId],
  );

  // ステータスを成功に変更
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

  // データ再取得
  const refetch = useCallback(
    () => fetchTableData(currentMode, true),
    [currentMode, fetchTableData],
  );

  // スクロール位置の復元
  const restoreScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const position = useAppStore.getState().scrollPositions[scrollKey];

    container.scrollTop = position?.top ?? 0;
    container.scrollLeft = position?.left ?? 0;
  }, [scrollKey]);

  // 表示モード切り替え時のスクロール位置復元
  useLayoutEffect(() => {
    if (
      restoredScrollKeyRef.current === scrollKey ||
      tableRowsMode !== currentMode ||
      rows.length === 0
    ) {
      return;
    }

    restoreScrollPosition();
    restoredScrollKeyRef.current = scrollKey;
  }, [
    scrollKey,
    currentMode,
    tableRowsMode,
    rows.length,
    restoreScrollPosition,
  ]);

  // 検索解除時のスクロール位置復元
  useLayoutEffect(() => {
    const previousSearchTerm = previousSearchTermRef.current;
    previousSearchTermRef.current = searchTerm;

    if (!previousSearchTerm || searchTerm) return;

    restoreScrollPosition();
  }, [searchTerm, rows, restoreScrollPosition]);

  // スクロール位置の保存
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
    currentMode,
    rows,
    selectedId,
    isLoading,
    containerRef,
    handleScroll,
    handleRowClick,
    handleMarkSuccess,
    refetch,
  };
}
