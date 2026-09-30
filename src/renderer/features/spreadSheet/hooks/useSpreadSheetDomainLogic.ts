import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import {
  selectFilteredSheetRows,
  selectSheetError,
  selectSheetFetching,
  selectSheetHasData,
} from "../store/spreadsheetSelectors";

import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";

export function useSpreadSheetDomainLogic<T>(sheetId: SheetId) {
  const { fetchSheetData, openGlobalModal, isAuthenticated } = useAppStore(
    useShallow((state: AppState) => ({
      fetchSheetData: state.fetchSheetData,
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
    })),
  );

  const { isFetching, hasData, error } = useAppStore(
    useShallow((state: AppState) => ({
      isFetching: selectSheetFetching(sheetId)(state),
      hasData: selectSheetHasData(sheetId)(state),
      error: selectSheetError(sheetId)(state),
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

  // sheetId に対応する Config を参照して検索キーを取得
  const config = Object.values(APP_REGISTRY).find(
    (cfg) => cfg.sheetId === sheetId,
  );

  const searchKeys = config?.search?.searchKeys;
  const skipFilter = config?.search?.skipFilter;

  const data = useAppStore(
    useShallow((state: AppState) =>
      selectFilteredSheetRows<T>(sheetId, searchKeys, skipFilter)(state),
    ),
  );

  const loadingTitle = config?.title ? `${config.title} ` : "";
  const loadingMessage = `${loadingTitle}...`;

  return {
    isAuthenticated,
    data,
    isFetching,
    error,
    handleRetry,
    loadingMessage,
    openGlobalModal,
  };
}
