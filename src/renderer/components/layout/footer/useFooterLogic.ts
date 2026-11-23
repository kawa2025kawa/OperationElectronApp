// src/renderer/components/layout/footer/useFooterLogic.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from "react";
import type { ChangeEvent } from "react";
import { useShallow } from "zustand/shallow";

import { useOptimisticValue } from "@renderer/hooks/useOptimisticValue";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { useAppStore } from "@renderer/store";
import type { CenterId } from "@shared/types/operation/operationTypes";

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

  const [localSearchTerm, setLocalSearchTerm] = useOptimisticValue(searchTerm);
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

      setLocalSearchTerm(value);

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        startTransition(() => {
          setSearchTerm(value);
        });
      }, 200);
    },
    [setLocalSearchTerm, setSearchTerm],
  );

  const handleToggleCenter = useCallback(
    (id: CenterId) => {
      toggleCenter(id);
    },
    [toggleCenter],
  );

  const currentViewDef = getAppViewConfig(currentView);

  const centers = useMemo<Record<string, boolean>>(
    () => ({
      "1C": is1CActive,
      "2C": is2CActive,
      "3C": is3CActive,
    }),
    [is1CActive, is2CActive, is3CActive],
  );

  return {
    centers,
    searchTerm: localSearchTerm,
    searchPlaceholder: currentViewDef?.search?.placeholder ?? null,
    handleSearchChange,
    handleToggleCenter,
  };
};