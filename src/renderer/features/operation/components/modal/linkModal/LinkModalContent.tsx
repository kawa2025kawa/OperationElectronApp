import React, { useEffect } from "react";
import type { ModalContentProps } from "@renderer/features/operation/components/modal/useOperationModalLogic";
import * as styles from "./linkModalContent.css";
import { useLinkModalLogic } from "./useLinkModalLogic";

export const LinkModalContent: React.FC<ModalContentProps> = React.memo(
  ({ registerPrimaryAction }) => {
    const { linkEntries, handleOpenUrl } = useLinkModalLogic();

    useEffect(() => {
      registerPrimaryAction();
      return () => {
        registerPrimaryAction();
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
              <div key={label} className={styles.linkRowCard}>
                <span className={styles.linkLabel}>{label}</span>
                <button
                  type="button"
                  className={styles.openButton}
                  onClick={() => void handleOpenUrl(String(url))}
                >
                  開く
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);

LinkModalContent.displayName = "LinkModalContent";

export default LinkModalContent;
