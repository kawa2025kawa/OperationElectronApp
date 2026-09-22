import React from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { LinkConfig } from "@shared/types/operation/operationTypes"; // ★ インポート
import { useLinkModalContent } from "./useLinkModalContent";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: LinkConfig[] | null; // ★ LinkConfig[] に変更
}

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  React.memo(({ link }) => {
    const { state, actions } = useLinkModalContent(link);
    return (
      <div className={styles.contentContainer}>
        <div className={styles.sectionTitle}>リンク一覧</div>
        <div className={styles.terminalSection}>
          {state.isEmpty ? (
            <EmptyState message="リンクがありません" />
          ) : (
            // ★ linkEntries (LinkConfig) の配列をループ処理
            state.linkItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={styles.terminalRow}
                onClick={() => void actions.handleOpenUrl(item.url)}
              >
                <div className={styles.nonTrBadge}>{item.key}</div>
                <div className={styles.flexCell}>
                  <div className={styles.cellValue}>{item.url}</div>
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
