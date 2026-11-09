import { memo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import * as styles from "./operationActionMenu.css";

interface OperationActionMenuItem {
  readonly key: string;
  readonly label: string;
}

interface OperationActionMenuProps {
  readonly actions: readonly OperationActionMenuItem[];
  readonly onActionSelect: (key: string) => void;
  readonly disabled?: boolean;
}

export const OperationActionMenu = memo(function OperationActionMenu({
  actions,
  onActionSelect,
  disabled = false,
}: OperationActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button type="button" className={styles.menuButton} disabled={disabled}>
          {"Menu ▼"}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.menuDropdownContent}
          sideOffset={5}
          align="end"
        >
          {actions.map((action) => (
            <DropdownMenu.Item
              key={action.key}
              className={styles.menuItem}
              onSelect={() => onActionSelect(action.key)}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
});

OperationActionMenu.displayName = "OperationActionMenu";
