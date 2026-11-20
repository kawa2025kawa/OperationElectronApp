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
    fetchTableData,
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
      fetchTableData: state.fetchTableData,
      updateOperationStatus: state.updateOperationStatus,
    })),
  );

  // irregular モードではステータス列が存在しないためフィルターを解除する
  useEffect(() => {
    if (currentMode === "irregular" && summaryStatusFilter !== null) {
      setSummaryStatusFilter(null);
    }
  }, [currentMode, summaryStatusFilter, setSummaryStatusFilter]);

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

  const activeStatusFilter =
    currentMode === "irregular" ? null : summaryStatusFilter;

  const isFiltered = Boolean(searchTerm) || activeStatusFilter !== null;

  const isSwitchingMode =
    isLoading || (tableRowsMode !== currentMode && rows.length === 0);

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
      scrollKey: `${currentView}:${currentMode}`,
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
  }, [containerRef, currentMode]);

  // テーブルインスタンス構築
  const columns = useMemo(
    () => getOperationColumns(currentMode),
    [currentMode],
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

  // 行操作ハンドラ
  const handleRowClick = useCallback(
    (kanriNo: string) => setSelectedId(currentMode, kanriNo),
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