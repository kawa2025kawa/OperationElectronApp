// src/renderer/features/operation/components/operationModeSwitcher/OperationModeSwitcher.tsx

import { memo, useMemo, useTransition } from "react";

import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
} from "@shared/types/registry/viewDefinition";

interface OperationModeSwitcherProps {
  readonly currentMode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

export const OperationModeSwitcher = memo(function OperationModeSwitcher({
  currentMode,
  onModeChange,
}: OperationModeSwitcherProps) {
  const [, startTransition] = useTransition();

  const items = useMemo(
    () =>
      Object.values(VIEW_MODES).map((mode) => ({
        id: mode,
        label: VIEW_MODE_LABELS[mode],
      })),
    [],
  );

  const handleModeChange = (mode: ViewMode): void => {
    if (mode === currentMode) return;
    startTransition(() => {
      onModeChange(mode);
    });
  };

  return (
    <SegmentedControl
      id="operationMode"
      items={items}
      value={currentMode}
      onChange={handleModeChange}
      size="md"
      fullWidth
    />
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";
