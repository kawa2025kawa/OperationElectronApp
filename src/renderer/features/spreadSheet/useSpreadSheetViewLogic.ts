//src\renderer\features\spreadSheet\useSpreadSheetViewLogic.ts

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore, type AppState } from "@renderer/store";
import { selectFilteredSheetRows } from "./store/spreadsheetSlice";
import { type SheetId } from "@shared/types/spreadsheetTypes";

const EMPTY_ARRAY = [] as const;

export function useSpreadSheetViewLogic() {
  const currentView = useAppStore((state: AppState) => state.currentView);
  const fetchSheetData = useAppStore((state: AppState) => state.fetchSheetData);

  const config = getAppViewConfig(currentView);
  const sheetId = (config?.sheetId as SheetId) ?? null;

  const isFetching = useAppStore((s: AppState) =>
    sheetId ? Boolean(s.isSheetFetching?.[sheetId]) : false,
  );
  const hasData = useAppStore((s: AppState) =>
    sheetId ? Boolean(s.sheetData?.[sheetId]) : false,
  );

  useEffect(() => {
    if (sheetId && !hasData && !isFetching) {
      void fetchSheetData(sheetId, "A1:ZZ10000");
    }
  }, [sheetId, hasData, isFetching, fetchSheetData]);

  const searchKeys = config?.search?.searchKeys;
  const skipFilter = config?.search?.skipFilter;

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
    loadingMessage: `${config?.title || ""} データを読み込み中...`,
    config,
  };
}
