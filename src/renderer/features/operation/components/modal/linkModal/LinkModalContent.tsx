// src/renderer/features/operation/components/modal/contents/linkModal/LinkModalContent.tsx

import React, { useEffect } from "react";
import type { ModalContentProps } from "@renderer/features/operation/components/modal/useOperationModalLogic";
import * as styles from "./linkModalContent.css";
import { useLinkModalLogic } from "./useLinkModalLogic";

export const LinkModalContent: React.FC<ModalContentProps> = React.memo(
  ({ registerPrimaryAction }) => {
    const { linkEntries, handleOpenUrl } = useLinkModalLogic();

    useEffect(() => {
      registerPrimaryAction(undefined);
      return () => {
        registerPrimaryAction(undefined);
      };
    }, [registerPrimaryAction]);

    return (
      <div className={styles.container}>
        <div className={styles.sectionTitle}>関連リンク一覧:</div>
        <div className={styles.listBox}>
          {linkEntries.length === 0 ? (
            <div className={styles.emptyContainer}>
              <span className={styles.emptyText}>NO DATA</span>
            </div>
          ) : (
            linkEntries.map(([label, url]) => (
              <button
                key={label}
                type="button"
                className={styles.linkCardButton}
                onClick={() => void handleOpenUrl(String(url))}
              >
                {/* 上段: キー */}
                <span className={styles.linkLabel}>{label}</span>
                {/* 下段: 値 */}
                <span className={styles.linkValue}>{String(url)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  },
);

LinkModalContent.displayName = "LinkModalContent";

export default LinkModalContent;
