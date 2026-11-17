// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import { memo, useCallback, useMemo } from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { LinkConfig } from "@shared/types/operation/operationTypes";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: LinkConfig[] | null;
}

const LINK_MODAL_CONSTANTS = {
  EMPTY_MESSAGE: "リンクがありません",
  OPEN_ERROR_PREFIX: "リンクを開けませんでした",
} as const;

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  memo(({ link }) => {
    const linkItems = useMemo(() => (Array.isArray(link) ? link : []), [link]);

    const handleOpenUrl = useCallback((url: string) => {
      void operationService
        .openExternal(url, LINK_MODAL_CONSTANTS.OPEN_ERROR_PREFIX)
        .catch(() => undefined);
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
                  onClick={() => handleOpenUrl(item.url)}
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
