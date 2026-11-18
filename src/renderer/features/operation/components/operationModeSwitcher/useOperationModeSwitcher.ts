// src/renderer/features/operation/components/operationModeSwitcher/useOperationModeSwitcher.ts

import { useCallback, useState } from "react";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";

export const OPERATION_MODE_ITEMS = Object.values(VIEW_MODES).map((mode) => ({
  id: mode,
  label: VIEW_MODE_LABELS[mode],
}));

export function useOperationModeSwitcher(
  currentMode: ViewMode,
  onModeChange: (mode: ViewMode) => void,
) {
  const [optimisticState, setOptimisticState] = useState<{
    source: ViewMode;
    value: ViewMode;
  }>(() => ({
    source: currentMode,
    value: currentMode,
  }));

  if (optimisticState.source !== currentMode) {
    setOptimisticState({
      source: currentMode,
      value: currentMode,
    });
  }

  const optimisticMode = optimisticState.value;

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode === optimisticMode) return;

      setOptimisticState({
        source: currentMode,
        value: mode,
      });
      onModeChange(mode);
    },
    [optimisticMode, currentMode, onModeChange],
  );

  return {
    items: OPERATION_MODE_ITEMS,
    optimisticMode,
    handleModeChange,
  };
}
