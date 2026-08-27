import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ViewMode } from "@shared/types/uiType";
import * as styles from "./SidePanel.css";
import { useSidePanel, type InfoRowData } from "./useSidePanel";

const MODES: ViewMode[] = ["operation", "irregular", "today"];

/* ============================================================
 * Sub Component: Mode Switcher
 * ============================================================ */

const ModeSwitcher = React.memo<{
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}>(({ currentMode, onModeChange }) => (
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
));

ModeSwitcher.displayName = "ModeSwitcher";

/* ============================================================
 * Sub Component: Info Row
 * ============================================================ */

const InfoRow = React.memo(({ label, value }: InfoRowData) => {
  const isRemarks = label === "備考";

  return (
    <div className={styles.row} data-remarks={isRemarks}>
      <span>{label}</span>
      <span className={styles.resultValue}>{value || "-"}</span>
    </div>
  );
});

InfoRow.displayName = "InfoRow";

/* ============================================================
 * Main Component: SidePanel
 * ============================================================ */

export const SidePanel: React.FC = React.memo(() => {
  const {
    hasSelection,
    currentMode,
    activeActions,
    infoRows,
    setMode,
    executeAction,
  } = useSidePanel();

  return (
    <div className={styles.panelContainer}>
      {/* 上部コントロール部 */}
      <div className={styles.topControls}>
        <ModeSwitcher currentMode={currentMode} onModeChange={setMode} />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={styles.menuButton}
              disabled={!hasSelection || activeActions.length === 0}
            >
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
      </div>

      {/* 下部 INFO パネル */}
      <div className={styles.infoList}>
        {infoRows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
});

SidePanel.displayName = "SidePanel";

SidePanel;
