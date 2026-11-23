// src/renderer/features/operation/components/operationModeSwitcher/useOperationModeSwitcher.ts

import { useCallback } from "react";
import { useOptimisticValue } from "@renderer/hooks/useOptimisticValue";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";

const OPERATION_MODE_ITEMS = Object.values(VIEW_MODES).map((mode) => ({
  id: mode,
  label: VIEW_MODE_LABELS[mode],
}));

export function useOperationModeSwitcher(
  currentMode: ViewMode,
  onModeChange: (mode: ViewMode) => void,
) {
  const [optimisticMode, setOptimisticMode] = useOptimisticValue(currentMode);

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode === optimisticMode) return;

      setOptimisticMode(mode);
      onModeChange(mode);
    },
    [optimisticMode, setOptimisticMode, onModeChange],
  );

  return {
    items: OPERATION_MODE_ITEMS,
    optimisticMode,
    handleModeChange,
  };
}