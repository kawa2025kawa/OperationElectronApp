// src/renderer/components/layout/footer/useFooterLogic.ts

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";

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

  const [searchInput, setSearchInput] = useState(() => ({
    source: searchTerm,
    value: searchTerm,
  }));

  if (searchTerm !== searchInput.source) {
    setSearchInput({
      source: searchTerm,
      value: searchTerm,
    });
  }

  const [, startTransition] = useTransition();
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

      setSearchInput({
        source: searchTerm,
        value,
      });

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        startTransition(() => {
          setSearchTerm(value);
        });
      }, 200);
    },
    [searchTerm, setSearchTerm],
  );

  const handleToggleCenter = (id: CenterId) => toggleCenter(id);
  const currentViewDef = getAppViewConfig(currentView);

  return {
    centers: {
      "1C": is1CActive,
      "2C": is2CActive,
      "3C": is3CActive,
    },
    isOperationView: currentView === APP_VIEW_IDS.OPERATION,
    searchTerm: searchInput.value,
    searchPlaceholder: currentViewDef?.search?.placeholder ?? null,
    handleSearchChange,
    handleToggleCenter,
  };
};
