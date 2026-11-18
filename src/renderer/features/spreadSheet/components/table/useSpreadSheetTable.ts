// src/renderer/features/spreadSheet/components/table/useSpreadSheetTable.ts

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  useTable,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";

import { usePersistentScroll } from "@renderer/hooks/usePersistentScroll";
import { useTableVirtualizer } from "@renderer/hooks/useTableVirtualizer";
import { useAppStore } from "@renderer/store";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { createRegistryGlobalFilter } from "@renderer/features/table/utils/tableSearchUtils";
import {
  getSpreadSheetCellText,
  SPREADSHEET_TABLE_FEATURES,
  type SpreadSheetTableFeatures,
} from "./spreadsheetTableConfig";

const EMPTY_ROWS: readonly never[] = Object.freeze([]);
const VIRTUAL_OVERSCAN_COUNT = 8;

export function useSpreadSheetTable<TData extends RowData>(
  rows: readonly TData[] | undefined,
  columns: TableOptions<SpreadSheetTableFeatures, TData>["columns"],
  getRowId: (row: TData, index: number) => string,
) {
  "use no memo";

  const headerWrapperRef = useRef<HTMLDivElement | null>(null);
  const currentView = useAppStore((state) => state.currentView);
  const searchTerm = useAppStore((state) => state.searchTerm);

  const safeRows = rows ?? (EMPTY_ROWS as readonly TData[]);
  const searchConfig = useMemo(
    () => getAppViewConfig(currentView).search,
    [currentView],
  );

  const globalFilterFn = useMemo(
    () =>
      createRegistryGlobalFilter<SpreadSheetTableFeatures, TData>(
        searchConfig?.searchKeys,
        searchConfig?.skipFilter,
      ),
    [searchConfig],
  );

  const table = useTable({
    features: SPREADSHEET_TABLE_FEATURES,
    data: safeRows,
    columns,
    getRowId,
    defaultColumn: {
      minSize: 0,
      cell: (info) => getSpreadSheetCellText(info.getValue()),
    },
    globalFilterFn,
    state: {
      globalFilter: searchTerm,
    },
  });

  const syncHeaderScrollLeft = useCallback((scrollLeft: number) => {
    const header = headerWrapperRef.current;

    if (header && header.scrollLeft !== scrollLeft) {
      header.scrollLeft = scrollLeft;
    }
  }, []);

  const { containerRef, handleScroll } = usePersistentScroll<HTMLDivElement>({
    scrollKey: currentView,
    canRestore: safeRows.length > 0,
    isFiltered: Boolean(searchTerm.trim()),
    restoreTrigger: safeRows,
    onHorizontalSync: syncHeaderScrollLeft,
  });

  useLayoutEffect(() => {
    const header = headerWrapperRef.current;
    const body = containerRef.current;

    if (header && body && header.scrollLeft !== body.scrollLeft) {
      header.scrollLeft = body.scrollLeft;
    }
  }, [containerRef, rows, columns]);

  const leafColumns = table.getAllLeafColumns();
  const columnWidths = leafColumns.map((column) => ({
    id: column.id,
    width: `${column.getSize()}%`,
  }));
  const tableRows = table.getRowModel().rows;
  const colSpanCount = Math.max(leafColumns.length, 1);

  const { virtualItems, paddingTop, paddingBottom } = useTableVirtualizer({
    count: tableRows.length,
    containerRef,
    overscan: VIRTUAL_OVERSCAN_COUNT,
  });

  return {
    headerWrapperRef,
    containerRef,
    table,
    columnWidths,
    tableRows,
    colSpanCount,
    virtualItems,
    paddingTop,
    paddingBottom,
    isEmpty: tableRows.length === 0,
    handleScroll,
  };
}

export type SpreadSheetTableInstance<TData extends RowData> = ReturnType<
  typeof useSpreadSheetTable<TData>
>["table"];