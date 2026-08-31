// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx

import React, { useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import clsx from "clsx";

import { useAppStore } from "@renderer/store";
import type { JobStatus } from "@shared/types/operationType";
import { STATUS_LABEL, STATUS_ORDER } from "@shared/types/uiType";

import * as styles from "./statusContextMenu.css";

interface Props {
  kanriNo: string;
}

type StatusVariantKey = keyof typeof styles.itemVariants;

const getStatusVariantKey = (status: JobStatus): StatusVariantKey =>
  status.toUpperCase() as StatusVariantKey;

export const StatusContextMenu: React.FC<Props> = ({ kanriNo }) => {
  const updateJobStatus = useAppStore((state) => state.updateJobStatus);

  const handleSelectStatus = useCallback(
    (status: JobStatus) => {
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

        {STATUS_ORDER.map((status) => (
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
};

React.memo(StatusContextMenu);
