// src/renderer/features/spreadSheet/components/modal/contents/shop/ShopModalContent.tsx
import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Shop } from "@shared/types/spreadsheetTypes";
import { useShopModalLogic } from "./useShopModalLogic";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";

export interface ShopModalContentProps {
  data: Shop;
  title: string;
  onClose: () => void;
}

export const ShopModalContent: React.FC<ShopModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { groups, selectedIndex, setSelectedIndex, displayItems } =
      useShopModalLogic(data);

    return (
      <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
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
            {displayItems.map((item, i) => (
              <div
                key={i}
                className={
                  item.label === "住所"
                    ? styles.fullWidthBlock
                    : styles.infoBlock
                }
              >
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

ShopModalContent.displayName = "ShopModalContent";
export default ShopModalContent;
