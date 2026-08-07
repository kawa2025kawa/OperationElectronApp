// src/renderer/features/operation/components/modal/contents/linkModal/LinkModalContent.tsx

import React, { useEffect } from "react";
import { useAppStore } from "@shared/store";
import { selectActiveSelectedItem } from "@shared/store/selectors/operationSelectors";
import type { ModalContentProps } from "../../OperationModal";
import * as styles from "./linkModalContent.css";

export const LinkModalContent: React.FC<ModalContentProps> = React.memo(
  ({ setFooterConfig }) => {
    const selectedItem = useAppStore(selectActiveSelectedItem);
    const links = selectedItem?.link ?? {};

    // リンク用モーダルは「閉じる」のみで実行ボタンは不要
    useEffect(() => {
      setFooterConfig({
        hidePrimary: true,
      });
    }, [setFooterConfig]);

    const linkEntries = Object.entries(links);

    const handleOpenUrl = (url: string) => {
      if (window.electronAPI.openExternal) {
        void window.electronAPI.openExternal(url);
      } else {
        void window.electronAPI.invoke("openExternal", url);
      }
    };

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
                  onClick={() => handleOpenUrl(String(url))}
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
