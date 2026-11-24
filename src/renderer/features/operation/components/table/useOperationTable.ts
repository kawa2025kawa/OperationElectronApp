// src/renderer/features/operation/components/table/useOperationTable.ts

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useTable, type ColumnFiltersState } from "@tanstack/react-table";
import { useShallow } from "zustand/shallow";

import { usePersistentScroll } from "@renderer/hooks/usePersistentScroll";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { createRegistryGlobalFilter } from "@renderer/features/table/utils/tableSearchUtils";
import { useAppStore } from "@renderer/store";
import {
  selectMergedOperationAndTodayRows,
  selectRowsForMode,
} from "@renderer/store/slices/operationStatusSlice";
import {
  JOB_STATUS,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";

import {
  EMPTY_OPERATION_ROWS,
  getOperationColumns,
  OPERATION_TABLE_FEATURES,
  type OperationColumnMeta,
  type TableFeaturesType,
} from "./operationTableConfig";
import { useOperationTableContextMenuStore } from "./useOperationTableContextMenu";
import {
  useOperationTableVirtualizer,
  type OperationRowVirtualizer,
} from "./useOperationTableVirtualizer";

export function useOperationTable() {
  "use no memo";

  const headerContainerRef = useRef<HTMLDivElement | null>(null);
  const virtualizerRef = useRef<OperationRowVirtualizer | null>(null);

  const {
    currentView,
    currentMode,
    searchTerm,
    summaryStatusFilter,
    setSummaryStatusFilter,
    setSelectedId,
    tableRows,
    tableRowsMode,
    tableRowsByMode,
    isLoading,
    isMergedSummaryLoading,
    fetchTableData,
    ensureOperationAndTodayData,
    updateOperationStatus,
  } = useAppStore(
    useShallow((state) => ({
      currentView: state.currentView,
      currentMode: state.currentMode,
      searchTerm: state.searchTerm,
      summaryStatusFilter: state.summaryStatusFilter,
      setSummaryStatusFilter: state.setSummaryStatusFilter,
      setSelectedId: state.setSelectedId,
      tableRows: state.tableRows,
      tableRowsMode: state.tableRowsMode,
      tableRowsByMode: state.tableRowsByMode,
      isLoading: state.isTableLoading,
      isMergedSummaryLoading: state.isMergedSummaryLoading,
      fetchTableData: state.fetchTableData,
      ensureOperationAndTodayData: state.ensureOperationAndTodayData,
      updateOperationStatus: state.updateOperationStatus,
    })),
  );

  // irregular モードではステータス列が存在しないためフィルターを解除する
  useEffect(() => {
    if (currentMode === "irregular" && summaryStatusFilter !== null) {
      setSummaryStatusFilter(null);
    }
  }, [currentMode, summaryStatusFilter, setSummaryStatusFilter]);

  // データ取得（キャッシュ有無の判定は slice 側の fetchTableData に委譲）
  useEffect(() => {
    if (tableRowsMode !== currentMode) {
      void fetchTableData(currentMode).catch((error: unknown) => {
        console.error("[OperationTable] Failed to load table data:", error);
      });
    }
  }, [currentMode, tableRowsMode, fetchTableData]);

  // サマリーフィルタ有効時は Operation と TODAY の両データを確保して合算表示に備える
  const isSummaryFilterActive =
    currentMode !== "irregular" && summaryStatusFilter !== null;

  useEffect(() => {
    if (!isSummaryFilterActive) return;

    void ensureOperationAndTodayData().catch((error: unknown) => {
      console.error(
        "[OperationTable] Failed to load merged summary table data:",
        error,
      );
    });
  }, [isSummaryFilterActive, ensureOperationAndTodayData]);

  // 表示対象データ（サマリーフィルタ時は Operation + TODAY 合算、通常時は現在モード）
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

  const activeStatusFilter =
    currentMode === "irregular" ? null : summaryStatusFilter;

  const isFiltered = Boolean(searchTerm) || activeStatusFilter !== null;

  const isSwitchingMode =
    isLoading ||
    (isSummaryFilterActive && isMergedSummaryLoading) ||
    (tableRowsMode !== currentMode && rows.length === 0);

  const canRestoreScroll =
    !isSwitchingMode && tableRowsMode === currentMode && rows.length > 0;

  const syncHeaderScrollLeft = useCallback((scrollLeft: number) => {
    if (headerContainerRef.current) {
      headerContainerRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  const handleAfterRestore = useCallback(
    ({ top }: { top: number; left: number }) => {
      virtualizerRef.current?.scrollToOffset(top, { align: "start" });
    },
    [],
  );

  const { containerRef, handleScroll: handlePersistentScroll } =
    usePersistentScroll<HTMLDivElement>({
      scrollKey: isSummaryFilterActive
        ? `${currentView}:summary`
        : `${currentView}:${currentMode}`,
      canRestore: canRestoreScroll,
      isFiltered,
      restoreTrigger: rows,
      onHorizontalSync: syncHeaderScrollLeft,
      onAfterRestore: handleAfterRestore,
    });

  const contextMenuStore = useOperationTableContextMenuStore();

  const handleTableScroll = useCallback(() => {
    contextMenuStore.close();
    handlePersistentScroll();
  }, [contextMenuStore, handlePersistentScroll]);

  useLayoutEffect(() => {
    const header = headerContainerRef.current;
    const body = containerRef.current;
    if (header && body) header.scrollLeft = body.scrollLeft;
  }, [containerRef, currentMode, isSummaryFilterActive]);

  // テーブルインスタンス構築（サマリーフィルタ時は共通ヘッダー5列を使用）
  const columns = useMemo(
    () => getOperationColumns(currentMode, isSummaryFilterActive),
    [currentMode, isSummaryFilterActive],
  );
  const searchConfig = getAppViewConfig(currentView).search;

  const globalFilterFn = useMemo(
    () =>
      createRegistryGlobalFilter<TableFeaturesType, OperationViewItem>(
        searchConfig?.searchKeys,
        searchConfig?.skipFilter,
      ),
    [searchConfig],
  );

  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      activeStatusFilter ? [{ id: "status", value: activeStatusFilter }] : [],
    [activeStatusFilter],
  );

  const table = useTable({
    features: OPERATION_TABLE_FEATURES,
    columns,
    data: rows ?? EMPTY_OPERATION_ROWS,
    getRowId: (row, index) => row.kanriNo.trim() || String(index),
    globalFilterFn,
    state: {
      globalFilter: searchTerm,
      columnFilters,
    },
  });

  const leafColumns = table.getAllLeafColumns();
  const columnWidths = leafColumns.map((column) => {
    const meta = column.columnDef.meta as OperationColumnMeta | undefined;
    return { id: column.id, width: meta?.width ?? "auto" };
  });
  const tableRowsModel = table.getRowModel().rows;
  const colSpanCount = Math.max(leafColumns.length, 1);

  // 仮想スクロール管理
  const { virtualItems, paddingTop, paddingBottom } =
    useOperationTableVirtualizer({
      count: isSwitchingMode ? 0 : tableRowsModel.length,
      containerRef,
      virtualizerRef,
    });

  // 行操作ハンドラ（サマリー合算時は該当行の所属モードにも選択状態を同期する）
  const handleRowClick = useCallback(
    (kanriNo: string) => {
      setSelectedId(currentMode, kanriNo);
      if (isSummaryFilterActive) {
        const trimmed = kanriNo.trim();
        const isInOperation = tableRowsByMode.operation.some(
          (item) => item.kanriNo.trim() === trimmed,
        );
        const isInToday = tableRowsByMode.today.some(
          (item) => item.kanriNo.trim() === trimmed,
        );
        if (isInOperation) setSelectedId("operation", kanriNo);
        if (isInToday) setSelectedId("today", kanriNo);
      }
    },
    [currentMode, isSummaryFilterActive, setSelectedId, tableRowsByMode],
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

  return {
    headerContainerRef,
    containerRef,
    table,
    columnWidths,
    tableRows: tableRowsModel,
    colSpanCount,
    virtualItems,
    paddingTop,
    paddingBottom,
    isLoading: isSwitchingMode,
    contextMenuStore,
    handleTableScroll,
    handleRowClick,
    handleMarkSuccess,
  };
}
