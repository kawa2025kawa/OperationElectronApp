// src/renderer/features/spreadSheet/components/modal/tantou/TantouModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Tantou } from "@shared/types/spreadsheetTypes";
import * as styles from "./tantouModalContent.css";
import { useTantouModalContent } from "./useTantouModalContent";

interface TantouModalContentProps {
  data: Tantou;
  title: string;
  onClose: () => void;
}

export const TantouModalContent: React.FC<TantouModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { selectedIndex, setSelectedIndex, groups, displayItems } =
      useTantouModalContent(data);

    return (
      <div className={styles.modalContainer}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <CloseButton onClick={onClose} />
        </header>

        {/* Tab List */}
        <div className={styles.tabContainer}>
          {groups.map((group, idx) => (
            <button
              key={group.title}
              type="button"
              className={styles.button}
              data-variant="tab"
              data-active={selectedIndex === idx}
              onClick={() => setSelectedIndex(idx)}
            >
              {group.title}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.contentContainer}>
          <div className={styles.gridContainer}>
            {displayItems.map((item) => (
              <div key={item.label} className={styles.card}>
                <div className={styles.label}>{item.label}</div>
                <div className={styles.value}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <button type="button" className={styles.button} onClick={onClose}>
            閉じる
          </button>
        </footer>
      </div>
    );
  },
);

TantouModalContent.displayName = "TantouModalContent";
export default TantouModalContent;
