// src/renderer/components/layout/navbar/useNavbarLogic.ts

import { useShallow } from "zustand/react/shallow";

import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/ui";
import { useAppStore, type AppState } from "@renderer/store";

export const useNavbarLogic = () => {
  const { currentView, toggleSidebar, currentMode, summary, isInitialLoaded } =
    useAppStore(
      useShallow((state: AppState) => ({
        currentView: state.currentView,
        toggleSidebar: state.toggleSidebar,
        currentMode: state.currentMode,
        summary: state.summary,
        isInitialLoaded: state.isInitialLoaded,
      })),
    );

  const currentViewDef = getAppViewConfig(currentView);
  const navbarTitle = currentViewDef?.title ?? "Unknown View";
  const isOperation = currentView === APP_VIEW_IDS.OPERATION;
  const isIrregular = currentMode === "irregular";
  const isShowSummary = isOperation && !isIrregular;

  const summaryDisplayType = !isOperation
    ? "none"
    : isShowSummary && isInitialLoaded
      ? "summary"
      : isIrregular
        ? "none"
        : "placeholder";

  const isKokyuhyo = currentView === APP_VIEW_IDS.KOKYUHYO;

  return {
    summary,
    navbarTitle,
    summaryDisplayType,
    isKokyuhyo,
    toggleSidebar,
  };
};

useNavbarLogic;
