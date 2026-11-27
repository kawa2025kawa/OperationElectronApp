// src/renderer/features/operation/components/table/useOperationTable.ts

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useTable, type ColumnFiltersState } from "@tanstack/react-table";
import { useShallow } from "zustand/shallow";

import { usePersistentScroll } from "@renderer/hooks/usePersistentScroll";
import {
  useTableVirtualizer,
  type TableRowVirtualizer,
} from "@renderer/hooks/useTableVirtualizer";
import { VIEW_MODES } from "@renderer/registry/appRegistry";
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
  getOperationColumns,
  OPERATION_TABLE_FEATURES,
  type OperationColumnMeta,
  type TableFeaturesType,
} from "./operationTableConfig";
import { useOperationTableContextMenuStore } from "./useOperationTableContextMenu";

export function useOperationTable() {
  "use no memo";

  const headerContainerRef = useRef<HTMLDivElement | null>(null);
  const virtualizerRef = useRef<TableRowVirtualizer | null>(null);

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

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (currentMode === VIEW_MODES.IRREGULAR && summaryStatusFilter !== null) {
      setSummaryStatusFilter(null);
    }
  }, [currentMode, summaryStatusFilter, setSummaryStatusFilter]);

  useEffect(() => {
    if (tableRowsMode !== currentMode) {
      void fetchTableData(currentMode).catch((error: unknown) => {
        console.error("[OperationTable] Failed to load table data:", error);
      });
    }
  }, [currentMode, tableRowsMode, fetchTableData]);

  const isSummaryFilterActive =
    currentMode !== VIEW_MODES.IRREGULAR && summaryStatusFilter !== null;

  useEffect(() => {
    if (!isSummaryFilterActive) return;

    void ensureOperationAndTodayData().catch((error: unknown) => {
      console.error(
        "[OperationTable] Failed to load merged summary table data:",
        error,
      );
    });
  }, [isSummaryFilterActive, ensureOperationAndTodayData]);

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
    currentMode === VIEW_MODES.IRREGULAR ? null : summaryStatusFilter;

  const isFiltered =
    Boolean(deferredSearchTerm) || activeStatusFilter !== null;

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

  const columns = useMemo(
    () => getOperationColumns(currentMode, isSummaryFilterActive),
    [currentMode, isSummaryFilterActive],
  );

  const globalFilterFn = useMemo(
    () => createRegistryGlobalFilter<TableFeaturesType, OperationViewItem>(),
    [],
  );

  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      activeStatusFilter ? [{ id: "status", value: activeStatusFilter }] : [],
    [activeStatusFilter],
  );

  const table = useTable({
    features: OPERATION_TABLE_FEATURES,
    columns,
    data: rows,
    getRowId: (row, index) => row.kanriNo.trim() || String(index),
    globalFilterFn,
    state: {
      globalFilter: deferredSearchTerm,
      columnFilters,
    },
  });

  const columnWidths = useMemo(
    () =>
      columns.map((column, index) => {
        const meta = column.meta as OperationColumnMeta | undefined;
        return {
          id: column.id ?? String(index),
          width: meta?.width ?? "auto",
        };
      }),
    [columns],
  );

  const tableRowsModel = table.getRowModel().rows;
  const colSpanCount = Math.max(columns.length, 1);

  const { virtualItems, paddingTop, paddingBottom } = useTableVirtualizer({
    count: isSwitchingMode ? 0 : tableRowsModel.length,
    containerRef,
    overscan: 4,
    virtualizerRef,
  });

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
        if (isInOperation) setSelectedId(VIEW_MODES.OPERATION, kanriNo);
        if (isInToday) setSelectedId(VIEW_MODES.TODAY, kanriNo);
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