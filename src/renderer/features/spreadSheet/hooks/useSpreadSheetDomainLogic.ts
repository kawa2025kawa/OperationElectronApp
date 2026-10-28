// src/renderer/features/spreadSheet/hooks/useSpreadSheetDomainLogic.ts

import { useShallow } from "zustand/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { selectFilteredSheetRows } from "@renderer/store/selectors/spreadsheetSelectors";
import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { AppViewDefinition } from "@shared/types/registry/viewDefinition";

type SheetSearchConfig = {
  sheetId: SheetId;
  search?: AppViewDefinition["search"];
};

/**
 * sheetId -> 検索設定のルックアップ用マップキャッシュ
 */
let sheetConfigMapCache: Map<SheetId, SheetSearchConfig> | null = null;

/**
 * 初回フック実行時に遅延生成することで、循環参照(TDZ)による未初期化エラーを回避
 */
function getSheetConfigMap(): Map<SheetId, SheetSearchConfig> {
  if (!sheetConfigMapCache) {
    const entries: Array<[SheetId, SheetSearchConfig]> = Object.values(
      APP_REGISTRY,
    ).flatMap((config): Array<[SheetId, SheetSearchConfig]> => {
      if (!config.sheetId) {
        return [];
      }

      const sheetId = config.sheetId as SheetId;

      return [
        [
          sheetId,
          {
            sheetId,
            search: config.search,
          },
        ],
      ];
    });

    sheetConfigMapCache = new Map(entries);
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
