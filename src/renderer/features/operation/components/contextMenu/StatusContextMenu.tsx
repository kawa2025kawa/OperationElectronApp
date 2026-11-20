// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import { memo, useMemo, type ComponentProps, type Ref } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import clsx from "clsx";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { JobStatus } from "@shared/types/operation/operationTypes";

import {
  useStatusContextMenu,
  type StatusMenuOption,
} from "./useStatusContextMenu";
import * as styles from "./statusContextMenu.css";

interface StatusContextMenuProps {
  kanriNo: string | null;
  workName?: string;
  currentStatus?: JobStatus;
  menuWidth?: number;
  anchor?: ComponentProps<typeof ContextMenu.Positioner>["anchor"];
  popupRef?: Ref<HTMLDivElement>;
  onClose?: () => void;
}

export const StatusContextMenu = memo<StatusContextMenuProps>(
  ({
    kanriNo,
    workName,
    currentStatus,
    menuWidth,
    anchor,
    popupRef,
    onClose,
  }) => {
    const {
      headerKanriNo,
      headerWorkName,
      primaryItems,
      secondaryItems,
      handleSelectStatus,
    } = useStatusContextMenu(kanriNo, workName, currentStatus);

    const popupStyle = useMemo(
      () => (menuWidth ? { width: `${menuWidth}px` } : undefined),
      [menuWidth],
    );

    if (!kanriNo) {
      return null;
    }

    const renderStatusItems = (items: readonly StatusMenuOption[]) =>
      items.map((item) => (
        <ContextMenu.Item
          key={item.status}
          className={clsx(styles.itemBase, styles.itemVariants[item.status])}
          data-current={item.isCurrent}
          closeOnClick
          onClick={() => handleSelectStatus(item.status)}
        >
          <span>{item.label}</span>
          {item.isCurrent && <span className={styles.currentIndicator}>✓</span>}
        </ContextMenu.Item>
      ));

    return (
      <ContextMenu.Portal>
        <ContextMenu.Positioner
          className={styles.positioner}
          anchor={anchor}
          align="start"
          side="bottom"
          sideOffset={12}
          alignOffset={0}
        >
          <ContextMenu.Popup
            ref={popupRef}
            className={styles.content}
            style={popupStyle}
          >
            <div className={styles.rowKanriNo}>
              <span>{headerKanriNo}</span>
              <CloseButton
                className={styles.closeButtonCompact}
                onClick={onClose}
              />
            </div>

            <div className={styles.rowWorkName} title={headerWorkName}>
              {headerWorkName}
            </div>

            {renderStatusItems(primaryItems)}
            {renderStatusItems(secondaryItems)}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    );
  },
);

StatusContextMenu.displayName = "StatusContextMenu";