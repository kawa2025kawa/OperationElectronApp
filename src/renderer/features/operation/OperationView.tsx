//src\renderer\features\operation\OperationView.tsx
import { memo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { UnifiedTable } from "@renderer/features/operation/components/table/OperationTable";
import type { JobStatus } from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@renderer/registry/appRegistry";

import {
  MODES,
  type InfoRowData,
  useOperationViewLogic,
} from "./useOperationViewLogic";
import * as styles from "./operationView.css";

// -----------------------------------------------------------------------------
// Sub Components
// -----------------------------------------------------------------------------

interface ModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const ModeSwitcher = memo(
  ({ currentMode, onModeChange }: ModeSwitcherProps) => (
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
  ),
);

const InfoRow = memo(({ label, value, type }: InfoRowData) => (
  <div className={styles.row} data-remarks={type === "remarks"}>
    <span>{label}</span>

    <span className={styles.resultValue}>
      {type === "status" && value ? (
        <StatusBadge status={value as JobStatus} />
      ) : (
        value || "-"
      )}
    </span>
  </div>
));

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const OperationView = memo(() => {
  const {
    currentMode,
    activeActions,
    infoRows,
    isMenuVisible,
    setMode,
    executeAction,
  } = useOperationViewLogic();

  return (
    <div className={styles.container}>
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <UnifiedTable />
        </div>
      </div>

      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          <div className={styles.topControls}>
            <ModeSwitcher currentMode={currentMode} onModeChange={setMode} />

            {isMenuVisible && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className={styles.menuButton}>
                    Menu ▼
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className={styles.menuDropdownContent}
                    sideOffset={5}
                    align="end"
                  >
                    {activeActions.map((action) => (
                      <DropdownMenu.Item
                        key={action.key}
                        className={styles.menuItem}
                        onSelect={() => executeAction(action.key)}
                      >
                        {action.label}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>

          <div className={styles.infoList}>
            {infoRows.map((row) => (
              <InfoRow key={row.field} {...row} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
});
