// src/renderer/features/operation/components/contextMenu/StatusContextMenu.tsx
import React, { useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import clsx from "clsx";
import { useAppStore } from "@shared/store/index";
import { STATUS_LABEL, STATUS_ORDER } from "@shared/types/uiType";
import type { JobStatus } from "@shared/types/operationType";
import * as styles from "./statusContextMenu.css";

interface Props {
  children: React.ReactNode;
  kanriNo: string;
}

export const StatusContextMenu: React.FC<Props> = ({ children, kanriNo }) => {
  const updateJobStatus = useAppStore((s) => s.updateJobStatus);

  const handleUpdateStatus = useCallback(
    async (status: JobStatus) => {
      await updateJobStatus({
        kanriNo,
        status,
        comment: "コンテキストメニューからの更新",
      });
    },
    [kanriNo, updateJobStatus],
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className={styles.content}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Status</span>
          </div>

          {STATUS_ORDER.map((status) => {
            const cssVariantKey =
              status.toUpperCase() as keyof typeof styles.itemVariants;
            const toneClass = styles.itemVariants[cssVariantKey] ?? {};

            return (
              <ContextMenu.Item
                key={status}
                className={clsx(styles.itemBase, toneClass)}
                onSelect={() => void handleUpdateStatus(status)}
              >
                {STATUS_LABEL[status]}
              </ContextMenu.Item>
            );
          })}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default StatusContextMenu;
