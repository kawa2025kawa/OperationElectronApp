// src/renderer/features/spreadSheet/hooks/useSpreadSheetDomainLogic.ts

import { useShallow } from "zustand/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { selectFilteredSheetRows } from "../store/spreadsheetSelectors";
import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { AppViewDefinition } from "@shared/types/registry/viewDefinition";

/**
 * sheetId -> ViewConfig のルックアップ用マップキャッシュ
 */
let sheetConfigMapCache: Map<SheetId, AppViewDefinition<any>> | null = null;

/**
 * 初回フック実行時に遅延生成することで、循環参照(TDZ)による未初期化エラーを回避
 */
function getSheetConfigMap(): Map<SheetId, AppViewDefinition<any>> {
  if (!sheetConfigMapCache) {
    sheetConfigMapCache = new Map<SheetId, AppViewDefinition<any>>(
      Object.values(APP_REGISTRY)
        .filter(
          (config): config is AppViewDefinition<any> & { sheetId: SheetId } =>
            Boolean(config.sheetId),
        )
        .map((config) => [config.sheetId, config]),
    );
  }
  return sheetConfigMapCache;
}

export function useSpreadSheetDomainLogic<T>(sheetId: SheetId) {
  const { openGlobalModal, isAuthenticated } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
    })),
  );

  // 初回呼び出し時に遅延評価されたMapから $O(1)$ で取得
  const config = getSheetConfigMap().get(sheetId);
  const searchKeys = config?.search?.searchKeys;
  const skipFilter = config?.search?.skipFilter;

  const data = useAppStore(
    useShallow((state: AppState) =>
      selectFilteredSheetRows<T>(sheetId, searchKeys, skipFilter)(state),
    ),
  );

  return {
    isAuthenticated,
    data,
    openGlobalModal,
  };
}
