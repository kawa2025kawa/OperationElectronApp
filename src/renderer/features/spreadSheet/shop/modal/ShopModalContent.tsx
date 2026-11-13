// src/renderer/features/spreadSheet/shop/modal/ShopModalContent.tsx

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { Tabs } from "@base-ui/react/tabs";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";
import { useShopModalContent } from "./useShopModalContent";
import {
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
  SHOP_MODAL_CONSTANTS,
} from "./shopModalConfig";
import { EMPTY_VALUE_FALLBACK } from "@shared/constants/commonConstants";
import * as styles from "./shopModalContent.css";

export interface ShopModalContentProps {
  data: Shop;
}

interface ShopTerminalRowProps {
  readonly type: (typeof TERMINAL_TYPES)[number];
  readonly data: Shop;
}

const ShopTerminalRow = memo(function ShopTerminalRow({
  type,
  data,
}: ShopTerminalRowProps) {
  const upperType = type.toUpperCase();

  return (
    <div className={styles.terminalRow}>
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
});

interface ShopStandardRowProps {
  readonly label: string;
  readonly value: string;
}

const ShopStandardRow = memo(function ShopStandardRow({
  label,
  value,
}: ShopStandardRowProps) {
  return (
    <div className={styles.terminalRow}>
      <div className={styles.nonTrBadge}>{label}</div>
      <div className={styles.flexCell}>
        <div className={styles.cellValue}>{value || EMPTY_VALUE_FALLBACK}</div>
      </div>
    </div>
  );
});

export const ShopModalContent: GlobalModalComponent<ShopModalContentProps> =
  memo(({ data }) => {
    const {
      selectedIndex,
      setSelectedIndex,
      groups,
      displayItems,
      isTimeRecorderTab,
      timeRecorderActions,
    } = useShopModalContent({ data });

    const tabItems = useMemo(
      () =>
        groups.map((group, idx) => ({
          id: idx,
          label: group.title,
        })),
      [groups],
    );

    return (
      <Tabs.Root
        className={styles.mainContainer}
        value={selectedIndex}
        onValueChange={(value) => setSelectedIndex(Number(value))}
      >
        <Tabs.List className={styles.tabBar}>
          {tabItems.map((tab) => {
            const isActive = selectedIndex === tab.id;

            return (
              <Tabs.Tab
                key={tab.id}
                value={tab.id}
                className={styles.tabButton}
              >
                {isActive && (
                  <motion.div
                    layoutId="shopModalTabSlider"
                    className={styles.tabSlider}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                <span className={styles.buttonText}>{tab.label}</span>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        <Tabs.Panel className={styles.contentContainer} value={selectedIndex}>
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

                {TERMINAL_TYPES.map((type) => (
                  <ShopTerminalRow key={type} type={type} data={data} />
                ))}
              </div>

              {timeRecorderActions.length > 0 && (
                <div className={styles.buttonContainer}>
                  {timeRecorderActions.map((action) => (
                    <ActionButton
                      key={action.id}
                      variant={action.variant ?? "default"}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </ActionButton>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.terminalSection}>
              {displayItems.map((item) => (
                <ShopStandardRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs.Root>
    );
  });

ShopModalContent.displayName = "ShopModalContent";
