// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Shop } from "@shared/types/spreadsheetTypes";
import * as styles from "./shopModalContent.css";
import { useShopModalContent } from "./useShopModalContent";

interface ShopModalContentProps {
  data: Shop;
  title: string;
  onClose: () => void;
}

export const ShopModalContent: React.FC<ShopModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { selectedIndex, setSelectedIndex, groups, displayItems } =
      useShopModalContent(data);

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
              <div
                key={item.label}
                className={styles.card}
                data-full-width={item.label === "住所"}
              >
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

ShopModalContent.displayName = "ShopModalContent";
export default ShopModalContent;
