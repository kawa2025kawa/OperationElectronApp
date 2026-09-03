// src/renderer/features/spreadSheet/useSpreadSheetViewLogic.ts

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import { selectFilteredSheetRows } from "./store/spreadsheetSlice";
import { type SheetId } from "@shared/types/spreadsheet";

const EMPTY_ARRAY = [] as const;

export function useSpreadSheetViewLogic() {
  const currentView = useAppStore((state: AppState) => state.currentView);
  const fetchSheetData = useAppStore((state: AppState) => state.fetchSheetData);

  const config = getAppViewConfig(currentView);
  const sheetId = (config?.sheetId as SheetId) ?? null;

  // シート関連の状態（isFetching, hasData, error）を useShallow で一括取得し、レンダリングサイクルを最適化
  const { isFetching, hasData, error } = useAppStore(
    useShallow((state: AppState) => ({
      isFetching: sheetId ? Boolean(state.isSheetFetching?.[sheetId]) : false,
      hasData: sheetId ? Boolean(state.sheetData?.[sheetId]) : false,
      error: sheetId ? (state.sheetErrors?.[sheetId] ?? null) : null,
    })),
  );

  // 手動リトライ処理
  const handleRetry = useCallback(() => {
    if (sheetId) {
      void fetchSheetData(sheetId);
    }
  }, [sheetId, fetchSheetData]);

  // 初回データ自動取得（未取得かつエラーなし・未取得中時）
  useEffect(() => {
    if (sheetId && !hasData && !isFetching && !error) {
      void fetchSheetData(sheetId);
    }
  }, [sheetId, hasData, isFetching, error, fetchSheetData]);

  const searchKeys = config?.search?.searchKeys;
  const skipFilter = config?.search?.skipFilter;

  // フィルタリング後のデータ取得
  const data = useAppStore(
    useShallow((state: AppState) =>
      selectFilteredSheetRows(sheetId, searchKeys, skipFilter)(state),
    ),
  );

  const columns = useMemo(
    () =>
      config?.columns?.filter((col: { hidden?: boolean }) => !col.hidden) ??
      EMPTY_ARRAY,
    [config?.columns],
  );

  return {
    sheetId,
    data,
    columns,
    selectedId: null,
    isFetching,
    error,
    handleRetry,
    loadingMessage: `${config?.title || ""} データを読み込み中...`,
    config,
  };
}
