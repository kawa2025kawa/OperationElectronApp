// src/renderer/features/operation/OperationView.tsx

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import { UnifiedTable } from "@renderer/features/operation/components/table/OperationTable";
import type { JobStatus } from "@shared/types/operation";
import type { ViewMode } from "@shared/types/ui";
import {
  useOperationViewLogic,
  MODES,
  type InfoRowData,
  type ViewAction,
} from "./useOperationViewLogic";
import * as styles from "./operationView.css";

/* ============================================================
 * Sub Components
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

const InfoRow = React.memo(({ label, value }: InfoRowData) => {
  const isRemarks = label === "コメント" || label === "備考";
  const isStatus = label === "ステータス";

  return (
    <div className={styles.row} data-remarks={isRemarks}>
      <span>{label}</span>
      <span className={styles.resultValue}>
        {isStatus && value ? (
          <StatusBadge status={value as JobStatus} />
        ) : (
          value || "-"
        )}
      </span>
    </div>
  );
});

InfoRow.displayName = "InfoRow";

/* ============================================================
 * Main Component: OperationView
 * ============================================================ */

export const OperationView: React.FC = React.memo(() => {
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
      {/* メインテーブル表示エリア */}
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <UnifiedTable />
        </div>
      </div>

      {/* 右側サイドパネル統合エリア */}
      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          {/* 上部コントロール部 */}
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
                    {activeActions.map((action: ViewAction) => (
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

          {/* 下部 INFO パネル */}
          <div className={styles.infoList}>
            {infoRows.map((row: InfoRowData) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";
