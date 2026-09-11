// src/renderer/features/operation/components/modal/linkModal/LinkModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { EmptyState } from "@renderer/components/ui/emptyState/EmptyState";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { useLinkModalContent } from "./useLinkModalContent";
import * as styles from "./linkModalContent.css";

interface LinkModalContentProps {
  link?: Record<string, string> | null;
}

export const LinkModalContent: GlobalModalComponent<LinkModalContentProps> =
  React.memo(({ link }) => {
    const { state, actions } = useLinkModalContent(link);
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);
    const closeModal = useAppStore((s) => s.closeGlobalModal);

    // 🎯 フッター領域へ「閉じる」ボタン単体を注入
    useEffect(() => {
      updateModalConfig({
        footerContent: (
          <ActionButton variant="default" onClick={closeModal}>
            閉じる
          </ActionButton>
        ),
      });
    }, [updateModalConfig, closeModal]);

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

// 🎯 コンポーネント自体にサイズ情報を定義
LinkModalContent.modalSize = {
  width: "min(85vw, 800px)",
  height: "min(80vh, 700px)",
};

LinkModalContent.displayName = "LinkModalContent";
