// src/renderer/features/spreadSheet/hooks/useSpreadSheetDomainLogic.ts

import { useShallow } from "zustand/shallow";
import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { selectFilteredSheetRows } from "@renderer/store/selectors/spreadsheetSelectors";
import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";

export function useSpreadSheetDomainLogic<T>(sheetId: SheetId) {
  const { openGlobalModal, isAuthenticated } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
    })),
  );

  // APP_REGISTRY 内から該当する sheetId を持つ設定を特定
  const viewConfig = Object.values(APP_REGISTRY).find(
    (config) => config.sheetId === sheetId,
  );
  const searchKeys = viewConfig?.search?.searchKeys;
  const skipFilter = viewConfig?.search?.skipFilter;

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
