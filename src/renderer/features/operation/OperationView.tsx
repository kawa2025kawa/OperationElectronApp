import { memo, useMemo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { OperationTable } from "@renderer/features/operation/components/table/OperationTable";

import { useOperationViewLogic } from "./useOperationViewLogic";
import { createInfoRows } from "./operationViewDisplayUtils";
import { OperationModeSwitcher } from "./components/OperationModeSwitcher";
import { OperationInfoRow } from "./components/OperationInfoRow";
import * as styles from "./operationView.css";

export const OperationView = memo(function OperationView() {
  const {
    currentMode,
    selectedItem,
    status,
    activeActions,
    isMenuVisible,
    setMode,
    executeAction,
  } = useOperationViewLogic();

  const infoRows = useMemo(
    () => createInfoRows(currentMode, selectedItem, status),
    [currentMode, selectedItem, status],
  );

  const handleActionSelect = (key: string): void => {
    requestAnimationFrame(() => {
      void executeAction(key);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableArea}>
        <div className={styles.tableCard}>
          <OperationTable />
        </div>
      </div>

      <aside className={styles.panelArea}>
        <div className={styles.panelContainer}>
          <div className={styles.topControls}>
            <OperationModeSwitcher
              currentMode={currentMode}
              onModeChange={setMode}
            />

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
                        onSelect={() => handleActionSelect(action.key)}
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
              <OperationInfoRow key={row.field} {...row} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
});

OperationView.displayName = "OperationView";
