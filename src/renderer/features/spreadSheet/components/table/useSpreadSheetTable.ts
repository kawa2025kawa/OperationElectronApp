// src/renderer/features/spreadSheet/components/table/useSpreadSheetTable.ts

import { useMemo } from "react";
import {
  useTable,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";

import { usePersistentScroll } from "@renderer/hooks/usePersistentScroll";
import { useAppStore } from "@renderer/store";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { createRegistryGlobalFilter } from "@renderer/features/table/utils/tableSearchUtils";
import {
  getSpreadSheetCellText,
  SPREADSHEET_TABLE_FEATURES,
  type SpreadSheetTableFeatures,
} from "./spreadsheetTableConfig";

const EMPTY_ROWS: readonly never[] = Object.freeze([]);

export function useSpreadSheetTable<TData extends RowData>(
  rows: readonly TData[] | undefined,
  columns: TableOptions<SpreadSheetTableFeatures, TData>["columns"],
  getRowId: (row: TData, index: number) => string,
  onHorizontalSync?: (scrollLeft: number) => void,
) {
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

  const { containerRef, handleScroll } = usePersistentScroll<HTMLDivElement>({
    scrollKey: currentView,
    canRestore: safeRows.length > 0,
    isFiltered: Boolean(searchTerm.trim()),
    restoreTrigger: safeRows,
    onHorizontalSync,
  });

  return {
    containerRef,
    table,
    handleScroll,
  };
}

export type SpreadSheetTableInstance<TData extends RowData> = ReturnType<
  typeof useSpreadSheetTable<TData>
>["table"];
