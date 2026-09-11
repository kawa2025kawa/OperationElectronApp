// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { Shop } from "@shared/types/spreadsheet";
import { useShopModalFooter } from "../hooks/useShopModalFooter";
import { useShopModalContent } from "./useShopModalContent";
import {
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
  TIME_RECORDER_IMAGE_ITEMS,
} from "./constants";
import * as styles from "./shopModalContent.css";

export interface ShopModalContentProps {
  data: Shop;
}

export const ShopModalContent: GlobalModalComponent<ShopModalContentProps> =
  React.memo(({ data }) => {
    const {
      selectedIndex,
      setSelectedIndex,
      groups,
      displayItems,
      isTimeRecorderTab,
      commentValue,
      handleOpenImage,
      getImageLinkUrl,
    } = useShopModalContent(data);

    const { excelPath, pdfPath, handleOpen } = useShopModalFooter(data);
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);
    const closeModal = useAppStore((s) => s.closeGlobalModal);

    // 🎯 子側から親 (GlobalModalManager) のフッター領域へボタン要素を注入する
    useEffect(() => {
      updateModalConfig({
        footerContent: (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* 左側: Excel / PDF アクションボタン */}
            <div
              className={styles.actionRow}
              style={{ border: "none", padding: 0 }}
            >
              {excelPath && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => void handleOpen(excelPath)}
                >
                  Excel
                </button>
              )}
              {pdfPath && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => void handleOpen(pdfPath)}
                >
                  PDF
                </button>
              )}
            </div>

            {/* 右側: 閉じるボタン */}
            <ActionButton variant="default" onClick={closeModal}>
              閉じる
            </ActionButton>
          </div>
        ),
      });
    }, [excelPath, pdfPath, handleOpen, updateModalConfig, closeModal]);

    return (
      <div className={styles.mainContainer}>
        {/* タブグループ */}
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

        {/* タブコンテンツ */}
        <div className={styles.contentContainer}>
          {isTimeRecorderTab ? (
            <div className={styles.trTabWrapper}>
              <div className={styles.trSummaryRow}>
                <div className={styles.summaryBadge}>
                  <span>設置台数 :</span>
                  <span>{data.deviceCount || "-"}</span>
                </div>
                {commentValue && commentValue !== "-" && (
                  <div className={styles.summaryComment}>
                    <span>備考 :</span>
                    <span>{commentValue}</span>
                  </div>
                )}
                <div className={styles.imageButtonList}>
                  {TIME_RECORDER_IMAGE_ITEMS.map(({ key, label }) => {
                    const rawValue = data[key];
                    const imageUrl = getImageLinkUrl(rawValue);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={styles.imageLinkButton}
                        onClick={() => handleOpenImage(rawValue)}
                        disabled={!imageUrl}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.terminalSection}>
                <div className={styles.terminalHeaderRow}>
                  <div className={styles.terminalHeaderBadge}>端末</div>
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

// モーダルサイズ設定
ShopModalContent.modalSize = {
  width: "min(90vw, 950px)",
  height: "min(80vh, 700px)",
};

ShopModalContent.displayName = "ShopModalContent";
