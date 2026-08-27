import React, { useEffect } from "react";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { useOperationModalContext } from "../OperationModalContext";
import { useLinkModalLogic } from "./useLinkModalLogic";
import * as styles from "../operationModal.css";

export const LinkModalContent: React.FC = React.memo(() => {
  const { registerPrimaryAction } = useOperationModalContext();
  const { linkEntries, handleOpenUrl } = useLinkModalLogic();

  useEffect(() => {
    registerPrimaryAction(undefined);
    return () => {
      registerPrimaryAction(undefined);
    };
  }, [registerPrimaryAction]);

  return (
    <div className={styles.contentFlexContainer}>
      <div className={styles.sectionTitle}>関連リンク一覧:</div>
      <div className={styles.commentBox}>
        {linkEntries.length === 0 ? (
          <EmptyState />
        ) : (
          linkEntries.map(([label, url]) => (
            <button
              key={label}
              type="button"
              className={styles.linkCardButton}
              onClick={() => void handleOpenUrl(String(url))}
            >
              <span className={styles.linkLabel}>{label}:</span>
              <span className={styles.linkValue}>{String(url)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
});

LinkModalContent.displayName = "LinkModalContent";

LinkModalContent;
