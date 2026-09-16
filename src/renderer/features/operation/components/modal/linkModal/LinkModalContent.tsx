// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import React from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { useLinkModalContent } from "./useLinkModalContent";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: Record<string, string> | null;
}

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  React.memo(({ link }) => {
    const { state, actions } = useLinkModalContent(link);

    return (
      <div className={styles.contentContainer}>
        <div className={styles.sectionTitle}>関連リンク一覧</div>
        <div className={styles.terminalSection}>
          {state.isEmpty ? (
            <EmptyState message="関連リンクが存在しません" />
          ) : (
            state.linkEntries.map(([label, url]) => (
              <button
                key={label}
                type="button"
                className={styles.terminalRow}
                onClick={() => void actions.handleOpenUrl(String(url))}
              >
                <div className={styles.nonTrBadge}>{label}</div>
                <div className={styles.flexCell}>
                  <div className={styles.cellValue}>{String(url)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  });

LinkModalContent.modalSize = {
  width: "min(85vw, 800px)",
  height: "min(80vh, 700px)",
};

LinkModalContent.displayName = "LinkModalContent";
