// src/renderer/features/operation/components/operationModeSwitcher/OperationModeSwitcher.tsx

import { memo } from "react";

import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import { useOperationModeSwitcher } from "./useOperationModeSwitcher";

interface OperationModeSwitcherProps {
  readonly currentMode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

export const OperationModeSwitcher = memo(function OperationModeSwitcher({
  currentMode,
  onModeChange,
}: OperationModeSwitcherProps) {
  const { items, optimisticMode, handleModeChange } = useOperationModeSwitcher(
    currentMode,
    onModeChange,
  );

  return (
    <SegmentedControl
      id="operationMode"
      items={items}
      value={optimisticMode}
      onChange={handleModeChange}
      size="md"
      fullWidth
    />
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";