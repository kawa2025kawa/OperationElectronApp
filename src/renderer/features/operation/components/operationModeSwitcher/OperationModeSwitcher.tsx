// src/renderer/features/operation/components/operationModeSwitcher/OperationModeSwitcher.tsx

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [optimisticMode, setOptimisticMode] = useState<ViewMode>(currentMode);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    setOptimisticMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const items = useMemo(
    () =>
      Object.values(VIEW_MODES).map((mode) => ({
        id: mode,
        label: VIEW_MODE_LABELS[mode],
      })),
    [],
  );

  const handleModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode === optimisticMode) return;

      setOptimisticMode(mode);

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          onModeChange(mode);
        });
      });
    },
    [optimisticMode, onModeChange],
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
