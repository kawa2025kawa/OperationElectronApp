// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import { memo, useCallback } from "react";

import * as ContextMenu from "@radix-ui/react-context-menu";
import clsx from "clsx";

import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_VALUES,
  type JobStatus,
} from "@shared/types/operation/operationTypes";

import * as styles from "./statusContextMenu.css";

interface StatusContextMenuProps {
  kanriNo: string;
}

type StatusVariantKey = keyof typeof styles.itemVariants;

const getStatusVariantKey = (status: JobStatus): StatusVariantKey => {
  return status.toUpperCase() as StatusVariantKey;
};

export const StatusContextMenu = memo<StatusContextMenuProps>(({ kanriNo }) => {
  const updateOperationStatus = useAppStore(
    (state) => state.updateOperationStatus,
  );

  const handleSelectStatus = (status: JobStatus) => {
    updateOperationStatus({
      kanriNo,
      status,
      comment: "",
    });
  };

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className={styles.content}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Status</span>
        </div>

        {JOB_STATUS_VALUES.map((status) => (
          <ContextMenu.Item
            key={status}
            className={clsx(
              styles.itemBase,
              styles.itemVariants[getStatusVariantKey(status)],
            )}
            onSelect={() => handleSelectStatus(status)}
          >
            {JOB_STATUS_LABEL[status]}
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
});
