// src/renderer/features/spreadSheet/useSpreadSheetViewLogic.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import type { Column } from "@shared/types/table/tableType";
import type { SheetId } from "@shared/types/spreadsheet/sheetTypes";
import { selectFilteredSheetRows } from "./store/spreadsheetSelectors";

const EMPTY_ARRAY = [] as const;

export function useSpreadSheetViewLogic() {
  const { currentView, fetchSheetData, openGlobalModal, isAuthenticated } =
    useAppStore(
      useShallow((state: AppState) => ({
        currentView: state.currentView,
        fetchSheetData: state.fetchSheetData,
        openGlobalModal: state.openGlobalModal,
        isAuthenticated: state.isAuthenticated,
      })),
    );

  const config = getAppViewConfig(currentView);
  const sheetId = (config?.sheetId as SheetId | undefined) ?? null;

  const { isFetching, hasData, error } = useAppStore(
    useShallow((state: AppState) => ({
      isFetching: sheetId ? Boolean(state.isSheetFetching[sheetId]) : false,
      hasData: sheetId ? Boolean(state.sheetData[sheetId]) : false,
      error: sheetId ? (state.sheetErrors[sheetId] ?? null) : null,
    })),
  );

  const handleRetry = useCallback(() => {
    if (sheetId && isAuthenticated) {
      void fetchSheetData(sheetId);
    }
  }, [sheetId, fetchSheetData, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && sheetId && !hasData && !isFetching && !error) {
      void fetchSheetData(sheetId);
    }
  }, [isAuthenticated, sheetId, hasData, isFetching, error, fetchSheetData]);

  const searchKeys = config?.search?.searchKeys;
  const skipFilter = config?.search?.skipFilter;

  const data = useAppStore(
    useShallow((state: AppState) =>
      selectFilteredSheetRows(sheetId, searchKeys, skipFilter)(state),
    ),
  );

  const columns = useMemo(
    () =>
      (config?.columns as readonly Column<object>[])?.filter(
        (col) => !col.hidden,
      ) ?? EMPTY_ARRAY,
    [config?.columns],
  );

  const loadingTitle = config?.title ? `${config.title} ` : "";
  const loadingMessage = `${loadingTitle}データを取得中...`;

  return {
    isAuthenticated,
    sheetId,
    data,
    columns,
    selectedId: null,
    isFetching,
    error,
    handleRetry,
    loadingMessage,
    openGlobalModal,
  };
}
