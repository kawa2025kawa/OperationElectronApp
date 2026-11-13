// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import { memo, useCallback, type ComponentProps, type Ref } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import clsx from "clsx";

import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS,
  JOB_STATUS_LABEL,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusContextMenu.css";

// 3段目: 予定、実行中、処理中、完了
const PRIMARY_ROW_STATUSES = [
  JOB_STATUS.SCHEDULED,
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
] as const satisfies readonly JobStatus[];

// 4段目: 残りのStatusの値（実行可能、待機、要対応、エラー）
const SECONDARY_ROW_STATUSES = [
  JOB_STATUS.READY,
  JOB_STATUS.WAITING,
  JOB_STATUS.NEEDS_ACTION,
  JOB_STATUS.ERROR,
] as const satisfies readonly JobStatus[];

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
    const updateOperationStatus = useAppStore(
      (state) => state.updateOperationStatus,
    );

    const handleSelectStatus = useCallback(
      (status: JobStatus) => {
        if (!kanriNo) return;

        updateOperationStatus({
          kanriNo,
          status,
          comment: "",
        });
      },
      [kanriNo, updateOperationStatus],
    );

    const renderStatusItems = (statuses: readonly JobStatus[]) =>
      statuses.map((status) => {
        const isCurrent = currentStatus === status;

        return (
          <ContextMenu.Item
            key={status}
            className={clsx(styles.itemBase, styles.itemVariants[status])}
            data-current={isCurrent}
            closeOnClick
            onClick={() => handleSelectStatus(status)}
          >
            <span>{JOB_STATUS_LABEL[status]}</span>
            {isCurrent && <span className={styles.currentIndicator}>✓</span>}
          </ContextMenu.Item>
        );
      });

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
            style={menuWidth ? { width: `${menuWidth}px` } : undefined}
          >
            {/* 1段目: KanriNo + 右上 CloseButton */}
            <div className={styles.rowKanriNo}>
              <span>{kanriNo ? `No.${kanriNo}` : ""}</span>
              <CloseButton
                className={styles.closeButtonCompact}
                onClick={onClose}
              />
            </div>

            {/* 2段目: WorkName */}
            <div className={styles.rowWorkName} title={workName}>
              {workName || (kanriNo ? `No.${kanriNo}` : "")}
            </div>

            {/* 3段目: 予定、実行中、処理中、完了 */}
            {renderStatusItems(PRIMARY_ROW_STATUSES)}

            {/* 4段目: 残りのStatusの値 */}
            {renderStatusItems(SECONDARY_ROW_STATUSES)}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    );
  },
);

StatusContextMenu.displayName = "StatusContextMenu";
