// src/renderer/features/spreadSheet/components/modal/contents/tantou/TantouModalContent.tsx
import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Tantou } from "@shared/types/spreadsheetTypes";
import { useTantouModalLogic } from "./useTantouModalLogic";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";

export interface TantouModalContentProps {
  data: Tantou;
  title: string;
  onClose: () => void;
}

export const TantouModalContent: React.FC<TantouModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { groups, selectedIndex, setSelectedIndex, displayItems } =
      useTantouModalLogic(data);

    return (
      <div className={styles.modalWrapper}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className={styles.tabContainer}>
          {groups.map((group, idx) => (
            <button
              key={group.title}
              className={styles.tabButton}
              data-active={selectedIndex === idx}
              onClick={() => setSelectedIndex(idx)}
              type="button"
            >
              {group.title}
            </button>
          ))}
        </div>

        <div className={styles.modalContentContainer}>
          <div className={styles.gridContainer}>
            {displayItems.map((item) => (
              <div key={item.label} className={styles.infoBlock}>
                <div className={styles.infoLabel}>{item.label}</div>
                <div className={styles.infoValue}>
                  {String(item.value ?? "-")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

TantouModalContent.displayName = "TantouModalContent";
export default TantouModalContent;
