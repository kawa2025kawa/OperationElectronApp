// src/renderer/features/operation/components/operationActionMenu/OperationActionMenu.tsx

import { memo } from "react";
import { Menu } from "@base-ui/react/menu";

import type { OperationViewItem } from "@shared/types/operation/operationTypes";

import { useOperationActionMenu } from "./useOperationActionMenu";
import * as styles from "./operationActionMenu.css";

interface OperationActionMenuProps {
  readonly selectedItem?: OperationViewItem;
}

export const OperationActionMenu = memo(function OperationActionMenu({
  selectedItem,
}: OperationActionMenuProps) {
  const { actions, isMenuEnabled, handleActionSelect } =
    useOperationActionMenu(selectedItem);

  return (
    <Menu.Root>
      <Menu.Trigger className={styles.menuButton} disabled={!isMenuEnabled}>
        {"Menu ▼"}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          className={styles.menuDropdownPositioner}
          sideOffset={5}
          align="end"
        >
          <Menu.Popup className={styles.menuDropdownContent}>
            {actions.map((action) => (
              <Menu.Item
                key={action.key}
                className={styles.menuItem}
                onClick={() => handleActionSelect(action.key)}
              >
                <span className={styles.menuItemInner}>
                  <span className={styles.menuItemLabel}>{action.label}</span>
                </span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
});

OperationActionMenu.displayName = "OperationActionMenu";
