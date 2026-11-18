// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import { memo } from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { LinkConfig } from "@shared/types/operation/operationTypes";
import { useLinkModalContent } from "./useLinkModalContent";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: LinkConfig[] | null;
}

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  memo(({ link }) => {
    const { linkItems, isEmpty, emptyMessage, handleOpenUrl } =
      useLinkModalContent(link);

    return (
      <div className={styles.contentContainer}>
        <div className={styles.terminalSection}>
          {isEmpty ? (
            <EmptyState message={emptyMessage} />
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