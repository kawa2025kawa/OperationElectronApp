// src/renderer/components/layout/footer/useFooterLogic.ts

import { useCallback, useMemo } from "react";
import type { ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";

import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";
import { CenterId } from "@renderer/store/slices/uiStateSlice";

interface FooterCenterItem {
  readonly id: CenterId;
  readonly isActive: boolean;
}

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

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    [setSearchTerm],
  );

  const handleToggleCenter = useCallback(
    (id: CenterId) => {
      void toggleCenter(id);
    },
    [toggleCenter],
  );

  const centers = useMemo<readonly FooterCenterItem[]>(() => {
    const activeMap: Record<CenterId, boolean> = {
      "1C": is1CActive,
      "2C": is2CActive,
      "3C": is3CActive,
    };

    return CenterId.VALUES.map((id) => ({
      id,
      isActive: activeMap[id],
    }));
  }, [is1CActive, is2CActive, is3CActive]);

  return {
    centers,
    searchTerm,
    searchPlaceholder: getAppViewConfig(currentView).searchPlaceholder ?? null,
    handleSearchChange,
    handleToggleCenter,
  };
};
