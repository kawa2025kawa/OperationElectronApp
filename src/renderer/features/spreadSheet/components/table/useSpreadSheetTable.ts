// src/renderer/features/spreadSheet/components/table/useSpreadSheetTable.ts

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  useTable,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";

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
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredScrollKeyRef = useRef<string | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentView = useAppStore((state) => state.currentView);
  const searchTerm = useAppStore((state) => state.searchTerm);
  const setScrollPosition = useAppStore((state) => state.setScrollPosition);

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

  useLayoutEffect(() => {
    if (restoredScrollKeyRef.current === currentView || safeRows.length === 0) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const saved = useAppStore.getState().scrollPositions[currentView];

    container.scrollTop = saved?.top ?? 0;
    container.scrollLeft = saved?.left ?? 0;
    restoredScrollKeyRef.current = currentView;
  }, [currentView, safeRows.length]);

  const saveScrollPosition = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    setScrollPosition(currentView, {
      top: container.scrollTop,
      left: container.scrollLeft,
    });
  }, [currentView, setScrollPosition]);

  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current !== null) return;

    scrollTimerRef.current = setTimeout(() => {
      saveScrollPosition();
      scrollTimerRef.current = null;
    }, 150);
  }, [saveScrollPosition]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }

      saveScrollPosition();
    },
    [saveScrollPosition],
  );

  return {
    containerRef,
    table,
    handleScroll,
  };
}

export type SpreadSheetTableInstance<TData extends RowData> = ReturnType<
  typeof useSpreadSheetTable<TData>
>["table"];
