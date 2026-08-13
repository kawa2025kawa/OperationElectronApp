// src/renderer/components/layout/navbar/useNavbarLogic.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { APP_REGISTRY, getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS, STATUS_LABEL } from "@shared/types/uiType";
import { SHEET_IDS, type Tantou } from "@shared/types/spreadsheetTypes";
import type { OperationItem, JobStatus } from "@shared/types/operationType";
import { useAppStore, type AppState } from "@shared/store";

export const useNavbarLogic = () => {
  const {
    openGlobalModal,
    closeGlobalModal,
    setSearchTerm,
    fetchSheetData,
    currentView,
    searchTerm,
    toggleSidebar,
    currentMode,
    summary,
    isInitialLoaded,
  } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      closeGlobalModal: state.closeGlobalModal,
      setSearchTerm: state.setSearchTerm,
      fetchSheetData: state.fetchSheetData,
      currentView: state.currentView,
      searchTerm: state.searchTerm,
      toggleSidebar: state.toggleSidebar,
      currentMode: state.currentMode,
      summary: state.summary,
      isInitialLoaded: state.isInitialLoaded,
    })),
  );

  const [inputValue, setInputValue] = useState(() => searchTerm);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setSearchTerm(value);
      }, 300);
    },
    [setSearchTerm],
  );

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getSummaryData = useCallback((label: string) => {
    if (label === "PROGRESS") return null;

    const { operationEntities, irregularEntities } = useAppStore.getState();

    const allItems: OperationItem[] = [
      ...Object.values(operationEntities),
      ...Object.values(irregularEntities),
    ];

    const filteredItems =
      label === "TOTAL"
        ? allItems
        : allItems.filter(
            (item) => item.status === (label.toLowerCase() as JobStatus),
          );

    return {
      title: `${STATUS_LABEL[label as keyof typeof STATUS_LABEL] ?? label} 一覧`,
      items: filteredItems,
    };
  }, []);

  const fetchTantouModalData = useCallback(async () => {
    await fetchSheetData(SHEET_IDS.TANTOU);

    const rawData = useAppStore.getState().sheetData[SHEET_IDS.TANTOU]?.data;
    const tantouData = (
      Array.isArray(rawData) ? rawData[0] : rawData
    ) as Tantou | null;
    const tantouConfig = APP_REGISTRY[APP_VIEW_IDS.TANTOU]?.modalConfig;

    return { tantouData, tantouConfig };
  }, [fetchSheetData]);

  const currentViewDef = getAppViewConfig(currentView);
  const navbarTitle = currentViewDef?.title ?? "Unknown View";
  const isOperation = currentView === APP_VIEW_IDS.OPERATION;
  const isIrregular = currentMode === "irregular";
  const isShowSummary = isOperation && !isIrregular;
  const searchPlaceholder = currentViewDef?.search?.placeholder ?? null;
  const searchWrapperStyle = isShowSummary ? undefined : { flex: "0 1 400px" };

  return {
    currentView,
    searchTerm: inputValue,
    summary,
    isInitialLoaded,
    navbarTitle,
    isOperation,
    isIrregular,
    isShowSummary,
    searchPlaceholder,
    searchWrapperStyle,
    getSummaryData,
    fetchTantouModalData,
    handleSearchChange,
    cleanupTimer,
    toggleSidebar,
    openGlobalModal,
    closeGlobalModal,
  };
};
