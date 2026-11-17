// src/renderer/components/layout/navbar/useNavbarLogic.ts

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/registry/viewDefinition";

import { useAppStore, type AppState } from "@renderer/store";

export const useNavbarLogic = () => {
  const { currentView, currentMode, isInitialLoaded, isAuthenticated } =
    useAppStore(
      useShallow((state: AppState) => ({
        currentView: state.currentView,
        currentMode: state.currentMode,
        isInitialLoaded: state.isInitialLoaded,
        isAuthenticated: state.isAuthenticated,
      })),
    );

  const navbarTitle = useMemo(() => {
    const currentViewDef = getAppViewConfig(currentView);
    return currentViewDef?.title ?? "Unknown View";
  }, [currentView]);

  const isOperation = currentView === APP_VIEW_IDS.OPERATION;
  const isIrregular = currentMode === "irregular";
  const isShowSummary = isOperation && !isIrregular;

  const summaryDisplayType = useMemo<"none" | "summary" | "placeholder">(() => {
    if (!isOperation) {
      return "none";
    }
    if (isShowSummary && isInitialLoaded) {
      return "summary";
    }
    if (isIrregular) {
      return "none";
    }
    return "placeholder";
  }, [isOperation, isShowSummary, isInitialLoaded, isIrregular]);

  const isKokyuhyo =
    currentView === APP_VIEW_IDS.KOKYUHYO && Boolean(isAuthenticated);

  return {
    navbarTitle,
    summaryDisplayType,
    isKokyuhyo,
  };
};