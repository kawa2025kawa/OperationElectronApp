// src/renderer/components/layout/footer/useFooterLogic.ts

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import type { CenterId } from "@shared/types/operation/operationTypes";

import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { APP_VIEW_IDS } from "@shared/types/registry/viewDefinition";

export const useFooterLogic = () => {
  const {
    is1CActive,
    is2CActive,
    is3CActive,
    toggleCenter,
    currentView,
    searchTerm,
    setSearchTerm,
  } = useAppStore(
    useShallow((state) => ({
      is1CActive: state.is1CActive,
      is2CActive: state.is2CActive,
      is3CActive: state.is3CActive,
      toggleCenter: state.toggleCenter,
      currentView: state.currentView,
      searchTerm: state.searchTerm,
      setSearchTerm: state.setSearchTerm,
    })),
  );

  // Search State
  const [inputValue, setInputValue] = useState(searchTerm);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);

      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSearchTerm(value), 300);
    },
    [setSearchTerm],
  );

  // Center Toggle Handler
  const handleToggleCenter = useCallback(
    (id: CenterId) => toggleCenter(id),
    [toggleCenter],
  );

  const currentViewDef = getAppViewConfig(currentView);

  return {
    centers: {
      "1C": is1CActive,
      "2C": is2CActive,
      "3C": is3CActive,
    },
    isOperationView: currentView === APP_VIEW_IDS.OPERATION,
    searchTerm: inputValue,
    searchPlaceholder: currentViewDef?.search?.placeholder ?? null,
    handleSearchChange,
    handleToggleCenter,
  };
};
