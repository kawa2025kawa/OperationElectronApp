// src/renderer/features/operation/components/operationModeSwitcher/OperationModeSwitcher.tsx

import { memo, useCallback, useMemo, useState } from "react";
import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
  type ViewMode,
} from "@renderer/registry/appRegistry";

interface OperationModeSwitcherProps {
  readonly currentMode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

export const OperationModeSwitcher = memo(function OperationModeSwitcher({
  currentMode,
  onModeChange,
}: OperationModeSwitcherProps) {
  const modeItems = useMemo(
    () =>
      Object.values(VIEW_MODES).map((mode) => ({
        id: mode,
        label: VIEW_MODE_LABELS[mode],
      })),
    [],
  );

  const [optimistic, setOptimistic] = useState<{
    source: ViewMode;
    value: ViewMode;
  }>(() => ({
    source: currentMode,
    value: currentMode,
  }));

  const optimisticMode =
    optimistic.source === currentMode ? optimistic.value : currentMode;

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode === optimisticMode) return;
      setOptimistic({ source: currentMode, value: mode });
      onModeChange(mode);
    },
    [currentMode, optimisticMode, onModeChange],
  );

  return (
    <SegmentedControl
      items={modeItems}
      value={optimisticMode}
      onChange={handleModeChange}
      size="md"
      fullWidth
    />
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";