// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import React, { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import { commands } from "@shared/service/commands";
import { useAppStore } from "@shared/store";
import * as styles from "../operationModal.css";
import { useOperationModalContext } from "../OperationModalContext";

export const LinkModalContent: React.FC = React.memo(() => {
  const { registerPrimaryAction } = useOperationModalContext();
  const selectedItem = useAppStore(selectActiveSelectedItem);

  const links = selectedItem?.link ?? {};
  const linkEntries = Object.entries(links);

  const handleOpenUrl = useCallback(async (rawUrl: string) => {
    try {
      await commands.openExternal(rawUrl.trim());
    } catch (error) {
      console.error("[LinkModalContent.handleOpenUrl] Failed:", error);
      toast.error("指定のパスが開けませんでした。");
    }
  }, []);

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
