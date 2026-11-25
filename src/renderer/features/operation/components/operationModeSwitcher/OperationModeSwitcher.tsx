// src/renderer/features/operation/components/operationModeSwitcher/OperationModeSwitcher.tsx

import { memo, useCallback } from "react";
import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import { useOptimisticValue } from "@renderer/hooks/useOptimisticValue";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
  type ViewMode,
} from "@shared/types/registry/viewDefinition";

interface OperationModeSwitcherProps {
  readonly currentMode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

const OPERATION_MODE_ITEMS = Object.values(VIEW_MODES).map((mode) => ({
  id: mode,
  label: VIEW_MODE_LABELS[mode],
}));

export const OperationModeSwitcher = memo(function OperationModeSwitcher({
  currentMode,
  onModeChange,
}: OperationModeSwitcherProps) {
  const [optimisticMode, setOptimisticMode] = useOptimisticValue(currentMode);

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode === optimisticMode) return;
      setOptimisticMode(mode);
      onModeChange(mode);
    },
    [optimisticMode, setOptimisticMode, onModeChange],
  );

  return (
    <SegmentedControl
      id="operationMode"
      items={OPERATION_MODE_ITEMS}
      value={optimisticMode}
      onChange={handleModeChange}
      size="md"
      fullWidth
    />
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";
