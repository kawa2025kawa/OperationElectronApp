// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import { memo, useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import clsx from "clsx";

import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_VALUES,
  OPERATION_FIELD_LABELS,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusContextMenu.css";

interface StatusContextMenuProps {
  kanriNo: string;
}

export const StatusContextMenu = memo<StatusContextMenuProps>(({ kanriNo }) => {
  const updateOperationStatus = useAppStore(
    (state) => state.updateOperationStatus,
  );

  const handleSelectStatus = useCallback(
    (status: JobStatus) => {
      updateOperationStatus({
        kanriNo,
        status,
        comment: "",
      });
    },
    [kanriNo, updateOperationStatus],
  );

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className={styles.content}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {OPERATION_FIELD_LABELS.status}
          </span>
        </div>

        {JOB_STATUS_VALUES.map((status) => (
          <ContextMenu.Item
            key={status}
            className={clsx(styles.itemBase, styles.itemVariants[status])}
            onSelect={() => handleSelectStatus(status)}
          >
            {JOB_STATUS_LABEL[status]}
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
});

StatusContextMenu.displayName = "StatusContextMenu";
