// src/renderer/features/operation/components/buttonPanel/ButtonPanel.tsx
import React from "react";
import type { ViewMode } from "@shared/types/uiType";
import { useButtonPanel } from "./useButtonPanel";
import * as styles from "./ButtonPanel.css";

const MODES: ViewMode[] = ["operation", "irregular", "today"];

const ModeSwitcher: React.FC<{
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}> = React.memo(({ currentMode, onModeChange }) => (
  <div className={styles.modeToggleContainer} data-mode={currentMode}>
    <div className={styles.modeToggleSlider} />
    {MODES.map((mode) => (
      <button
        key={mode}
        className={styles.modeToggleButton}
        data-active={currentMode === mode}
        onClick={() => onModeChange(mode)}
      >
        <span className={styles.toggleText}>
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </span>
      </button>
    ))}
  </div>
));
ModeSwitcher.displayName = "ModeSwitcher";

const ButtonPanelComponent: React.FC = () => {
  const {
    currentMode,
    isScriptRunning,
    configuredActions,
    handleModeChange,
    executeAction,
    checkIsDisabled,
  } = useButtonPanel();

  return (
    <div className={styles.actionsCard}>
      <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />

      <div className={styles.buttonGrid}>
        {configuredActions.map((action) => (
          <button
            key={action.key}
            className={styles.actionButton}
            disabled={checkIsDisabled(action.key)}
            onClick={() => executeAction(action.key)}
          >
            <span className={styles.actionButtonText}>
              {action.key === "script" && isScriptRunning
                ? "SCRIPT RUNNING..."
                : action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ButtonPanel = React.memo(ButtonPanelComponent);
ButtonPanel.displayName = "ButtonPanel";
export default ButtonPanel;
