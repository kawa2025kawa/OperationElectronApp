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
    const { state, actions } = useLinkModalContent(link);

    return (
      <div className={styles.contentContainer}>
        <div className={styles.sectionTitle}>リンク一覧</div>
        <div className={styles.terminalSection}>
          {state.isEmpty ? (
            <EmptyState message="リンクがありません" />
          ) : (
            state.linkItems.map((item) => (
              <div key={item.key} className={styles.terminalRow}>
                <button
                  type="button"
                  className={styles.nonTrBadge}
                  onClick={() => void actions.handleOpenUrl(item.url)}
                >
                  {item.key}
                </button>
                <div className={styles.flexCell}>
                  <div
                    className={styles.cellValue}
                    title={item.url}
                    style={{ userSelect: "text" }}
                  >
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
