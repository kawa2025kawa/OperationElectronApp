// src/renderer/features/spreadSheet/shop/modal/ShopModalContent.tsx

import { memo, useEffect, useMemo } from "react";
import { useAppStore } from "@renderer/store";
import { SegmentedControl } from "@renderer/components/ui/toggle/SegmentedControl";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { useShopModalContent } from "./useShopModalContent";
import {
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
  SHOP_MODAL_CONSTANTS,
  EMPTY_VALUE_FALLBACK,
} from "./shopModalConfig";
import * as styles from "./shopModalContent.css";

export interface ShopModalContentProps {
  data: Shop;
}

export const ShopModalContent: GlobalModalComponent<ShopModalContentProps> =
  memo(({ data }) => {
    const {
      selectedIndex,
      setSelectedIndex,
      groups,
      displayItems,
      isTimeRecorderTab,
      leftActions,
    } = useShopModalContent({ data });

    const updateModalConfig = useAppStore((s) => s.updateModalConfig);

    useEffect(() => {
      updateModalConfig({ leftActions });

      return () => {
        updateModalConfig({ leftActions: [] });
      };
    }, [leftActions, updateModalConfig]);

    const tabItems = useMemo(
      () =>
        groups.map((group, idx) => ({
          id: idx,
          label: group.title,
        })),
      [groups],
    );

    return (
      <div className={styles.mainContainer}>
        <SegmentedControl
          id="shopModalTabs"
          items={tabItems}
          value={selectedIndex}
          onChange={setSelectedIndex}
          size="md"
          fullWidth
        />

        <div className={styles.contentContainer}>
          {isTimeRecorderTab ? (
            <div className={styles.trTabWrapper}>
              <div className={styles.terminalSection}>
                <div className={styles.terminalHeaderRow}>
                  <div className={styles.terminalHeaderBadge}>
                    {SHOP_MODAL_CONSTANTS.TR_HEADER_BADGE}
                  </div>
                  <div className={styles.terminalHeaderGrid}>
                    {TERMINAL_FIELDS.map(({ label }) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>
                </div>

                {TERMINAL_TYPES.map((type) => {
                  const upperType = type.toUpperCase();

                  return (
                    <div key={type} className={styles.terminalRow}>
                      <div className={styles.terminalBadge}>{upperType}</div>

                      <div className={styles.terminalGrid}>
                        {TERMINAL_FIELDS.map(({ suffix }) => {
                          const fieldKey = `${type}${suffix}` as keyof Shop;
                          const val = data[fieldKey] || EMPTY_VALUE_FALLBACK;

                          return (
                            <div key={suffix} className={styles.cellValue}>
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.terminalSection}>
              {displayItems.map((item) => (
                <div key={item.label} className={styles.terminalRow}>
                  <div className={styles.nonTrBadge}>{item.label}</div>

                  <div className={styles.flexCell}>
                    <div className={styles.cellValue}>
                      {item.value || EMPTY_VALUE_FALLBACK}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });

ShopModalContent.displayName = "ShopModalContent";
