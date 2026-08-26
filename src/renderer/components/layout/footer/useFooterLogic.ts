// src/renderer/components/layout/footer/useFooterLogic.ts

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { selectIsAllCenterActive } from "@shared/store/slices/centerSlice";

export const useFooterLogic = () => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    isAllCenterActive,
    toggleCenterPill,
    currentView,
    searchTerm,
    setSearchTerm,
    openGlobalModal,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      is1CActive: state.is1CActive,
      is2CActive: state.is2CActive,
      is3CActive: state.is3CActive,
      isAllCenterActive: selectIsAllCenterActive(state),
      toggleCenterPill: state.toggleCenterPill,
      currentView: state.currentView,
      searchTerm: state.searchTerm,
      setSearchTerm: state.setSearchTerm,
      openGlobalModal: state.openGlobalModal,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  const [inputValue, setInputValue] = useState(searchTerm);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setSearchTerm(value);
      }, 300);
    },
    [setSearchTerm],
  );

  // --------------------------------------------------------------------------
  // View
  // --------------------------------------------------------------------------

  const currentViewDef = getAppViewConfig(currentView);
  const searchPlaceholder = currentViewDef?.search?.placeholder ?? null;
  const isOperationView = currentView === APP_VIEW_IDS.OPERATION;

  // --------------------------------------------------------------------------
  // Center toggle
  // --------------------------------------------------------------------------

  const handleToggle1C = useCallback(() => {
    toggleCenterPill("is1CActive");
  }, [toggleCenterPill]);

  const handleToggle2C = useCallback(() => {
    toggleCenterPill("is2CActive");
  }, [toggleCenterPill]);

  const handleToggle3C = useCallback(() => {
    toggleCenterPill("is3CActive");
  }, [toggleCenterPill]);

  return {
    is1CActive,
    is2CActive,
    is3CActive,
    isAllCenterActive,

    isOperationView,

    searchTerm: inputValue,
    searchPlaceholder,
    handleSearchChange,

    handleToggle1C,
    handleToggle2C,
    handleToggle3C,

    openGlobalModal,
    closeGlobalModal,
  };
};
