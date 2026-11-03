// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { systemIpcService } from "@renderer/services/systemIpcService";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { LinkConfig } from "@shared/types/operation/operationTypes";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: LinkConfig[] | null;
}

const LINK_MODAL_CONSTANTS = {
  EMPTY_MESSAGE: "リンクがありません",
  OPEN_ERROR_MESSAGE: "リンクを開けませんでした",
} as const;

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  memo(({ link }) => {
    const linkItems = useMemo(() => (Array.isArray(link) ? link : []), [link]);

    const handleOpenUrl = useCallback(async (url: string) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return;

      try {
        await systemIpcService.openExternal(cleanUrl);
      } catch (error) {
        console.error("[LinkModalContent] Failed to open external URL:", error);
        toast.error(LINK_MODAL_CONSTANTS.OPEN_ERROR_MESSAGE);
      }
    }, []);

    const isEmpty = linkItems.length === 0;

    return (
      <div className={styles.contentContainer}>
        <div className={styles.terminalSection}>
          {isEmpty ? (
            <EmptyState message={LINK_MODAL_CONSTANTS.EMPTY_MESSAGE} />
          ) : (
            linkItems.map((item) => (
              <div key={item.key} className={styles.terminalRow}>
                <button
                  type="button"
                  className={styles.nonTrBadge}
                  onClick={() => void handleOpenUrl(item.url)}
                >
                  {item.key}
                </button>
                <div className={styles.flexCell}>
                  <div className={styles.cellValue} title={item.url}>
                    {item.url}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  });

LinkModalContent.displayName = "LinkModalContent";
