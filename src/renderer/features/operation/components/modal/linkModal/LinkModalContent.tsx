// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import { memo, useCallback } from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { LinkConfig } from "@shared/types/operation/operationTypes";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: LinkConfig[] | null;
}

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  memo(({ link }) => {
    const linkItems = Array.isArray(link) ? link : [];

    const handleOpenUrl = useCallback((url: string) => {
      void operationService
        .openExternal(url, "リンクを開けませんでした")
        .catch(() => undefined);
    }, []);

    return (
      <div className={styles.contentContainer}>
        <div className={styles.terminalSection}>
          {linkItems.length === 0 ? (
            <EmptyState message="リンクがありません" />
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
