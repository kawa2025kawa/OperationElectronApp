import { memo } from "react";

import type { ViewMode } from "@shared/types/registry/viewDefinition";
import { VIEW_MODES } from "@shared/types/registry/viewDefinition";

import * as styles from "../operationView.css";

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
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
});

OperationModeSwitcher.displayName = "OperationModeSwitcher";
