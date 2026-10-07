//src\renderer\features\spreadSheet\hooks\useSpreadSheetDomainLogic.ts
import { useShallow } from "zustand/react/shallow";

import { useAppStore, type AppState } from "@renderer/store";
import { APP_REGISTRY } from "@renderer/registry/appRegistry";
import { selectFilteredSheetRows } from "../store/spreadsheetSelectors";

import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";

export function useSpreadSheetDomainLogic<T>(sheetId: SheetId) {
  const { openGlobalModal, isAuthenticated } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
    })),
  );

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
    loadingMessage,
    openGlobalModal,
  };
}
