// src/renderer/features/operation/components/OperationModeSwitcher.tsx

import { memo } from "react";

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import {
  VIEW_MODES,
  VIEW_MODE_LABELS,
} from "@shared/types/registry/viewDefinition";
import * as styles from "@renderer/features/operation/operationView.css";

const MODES: readonly ViewMode[] = Object.values(VIEW_MODES);

interface OperationModeSwitcherProps {
  readonly currentMode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

export const OperationModeSwitcher = memo(function OperationModeSwitcher({
  currentMode,
  onModeChange,
}: OperationModeSwitcherProps) {
  return (
    <div className={styles.modeToggleContainer} data-mode={currentMode}>
      <div className={styles.modeToggleSlider} />

      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={styles.modeToggleButton}
          data-active={currentMode === mode}
          onClick={() => onModeChange(mode)}
        >
          {VIEW_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";
