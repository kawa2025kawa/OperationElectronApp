// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx
import React from "react";
import type { Shop } from "@shared/types/spreadsheetTypes";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "./ShopModalContent.css";
import { useShopModalContent } from "./useShopModalContent";

export const ShopModalContent: React.FC<SpreadSheetModalProps<Shop>> =
  React.memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, groups, displayItems } =
      useShopModalContent(data);

    return (
      <div className={styles.mainContainer}>
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

        {/* Card Grid Content */}
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
      </div>
    );
  });

ShopModalContent.displayName = "ShopModalContent";
