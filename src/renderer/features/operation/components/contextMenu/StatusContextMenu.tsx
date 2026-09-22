// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import React, { useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import clsx from "clsx";
import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS,
  STATUS_LABEL,
  StatusOrder,
  type JobStatus,
} from "@shared/types/operation/operationTypes";
import * as styles from "./statusContextMenu.css";

interface StatusContextMenuProps {
  kanriNo: string;
}

type StatusVariantKey = keyof typeof styles.itemVariants;

const getStatusVariantKey = (status: JobStatus): StatusVariantKey => {
  // スタイル側のキー名（大文字変換など）に合わせて変換
  return status.toUpperCase() as StatusVariantKey;
};

export const StatusContextMenu: React.FC<StatusContextMenuProps> = React.memo(
  ({ kanriNo }) => {
    const updateJobStatus = useAppStore((state) => state.updateJobStatus);

    const handleSelectStatus = useCallback(
      (status: JobStatus) => {
        if (status === JOB_STATUS.SUCCESS) {
          void useAppStore.getState().completeSelectedOperation();
          return;
        }
        void updateJobStatus({
          kanriNo,
          status,
          comment: "",
        });
      },
      [kanriNo, updateJobStatus],
    );

    return (
      <ContextMenu.Portal>
        <ContextMenu.Content className={styles.content}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Status</span>
          </div>
          {/* 🎯 StatusOrder.ORDER 配列を参照してループ */}
          {StatusOrder.ORDER.map((status: JobStatus) => (
            <ContextMenu.Item
              key={status}
              className={clsx(
                styles.itemBase,
                styles.itemVariants[getStatusVariantKey(status)],
              )}
              onSelect={() => handleSelectStatus(status)}
            >
              {STATUS_LABEL[status]}
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    );
  },
);

StatusContextMenu.displayName = "StatusContextMenu";
