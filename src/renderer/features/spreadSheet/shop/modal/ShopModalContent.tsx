import { memo, useEffect } from "react";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { useShopModalFooter } from "./useShopModalFooter";
import { useShopModalContent } from "./useShopModalContent";
import { TERMINAL_TYPES, TERMINAL_FIELDS } from "./shopModalConfig";
import * as styles from "./shopModalContent.css";

export interface ShopModalContentProps {
  data: Shop;
}

export const ShopModalContent: GlobalModalComponent<ShopModalContentProps> =
  memo(({ data }) => {
    const { excelPath, pdfPath, handleOpen } = useShopModalFooter(data);
    const {
      selectedIndex,
      setSelectedIndex,
      groups,
      displayItems,
      isTimeRecorderTab,
      leftActions,
    } = useShopModalContent({ data, excelPath, pdfPath, handleOpen });
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);

    useEffect(() => {
      updateModalConfig({ leftActions });
      return () => {
        updateModalConfig({ leftActions: [] });
      };
    }, [leftActions, updateModalConfig]);

    return (
      <div className={styles.mainContainer}>
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

        <div className={styles.contentContainer}>
          {isTimeRecorderTab ? (
            <div className={styles.trTabWrapper}>
              <div className={styles.terminalSection}>
                <div className={styles.terminalHeaderRow}>
                  <div className={styles.terminalHeaderBadge}>TR</div>
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
                          const val = data[fieldKey] || "-";
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
                    <div className={styles.cellValue}>{item.value || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });

ShopModalContent.modalSize = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};
