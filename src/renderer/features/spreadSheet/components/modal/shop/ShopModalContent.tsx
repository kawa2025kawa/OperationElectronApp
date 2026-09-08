// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx

import React from "react";
import type { Shop } from "@shared/types/spreadsheet";
import type { ModalContentProps } from "@renderer/features/spreadSheet/components/modal/SpreadSheetModal";
import { useShopModalContent } from "./useShopModalContent";
import {
  TERMINAL_TYPES,
  TERMINAL_FIELDS,
  TIME_RECORDER_IMAGE_ITEMS,
} from "./constants";
import * as styles from "./shopModalContent.css";

export const ShopModalContent: React.FC<ModalContentProps<Shop>> = React.memo(
  ({ data }) => {
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

    return (
      <div className={styles.mainContainer}>
        {/* タブヘッダー */}
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

        {/* メインコンテンツエリア */}
        <div className={styles.contentContainer}>
          {isTimeRecorderTab ? (
            /* タイムレコーダタブ */
            <div className={styles.trTabWrapper}>
              <div className={styles.trSummaryRow}>
                <div className={styles.summaryBadge}>
                  <span className={styles.summaryLabel}>端末台数:</span>
                  <span className={styles.summaryValue}>
                    {data.deviceCount || "-"}
                  </span>
                </div>

                {commentValue && commentValue !== "-" && (
                  <div className={styles.summaryComment}>
                    <span className={styles.summaryLabel}>コメント:</span>
                    <span className={styles.summaryCommentText}>
                      {commentValue}
                    </span>
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
                        📷 {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* タイムレコーダー一覧（ヘッダー付きテーブルグリッド） */}
              <div className={styles.terminalSection}>
                {/* ヘッダー行 */}
                <div className={styles.terminalHeaderRow}>
                  <div className={styles.terminalHeaderBadge}>端末番号</div>
                  <div className={styles.terminalHeaderGrid}>
                    {TERMINAL_FIELDS.map(({ label }) => (
                      <div key={label} className={styles.terminalHeaderCell}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* データ行 (TR1 ~ TR4) */}
                {TERMINAL_TYPES.map((type) => {
                  const upperType = type.toUpperCase();
                  return (
                    <div key={type} className={styles.terminalRow}>
                      <div className={styles.terminalBadge}>{upperType}</div>
                      <div className={styles.terminalGrid}>
                        {TERMINAL_FIELDS.map(({ suffix }) => {
                          // data オブジェクトから動的にキーを取得 (tr1, tr1Ip, tr1Model, tr1Ronri, tr1Butsuri など)
                          const fieldKey = `${type}${suffix}` as keyof Shop;
                          const val = data[fieldKey] || "-";

                          return (
                            <div key={suffix} className={styles.terminalCell}>
                              <div className={styles.cellValue}>{val}</div>
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
            /* タイムレコーダ以外のタブ */
            <div className={styles.terminalSection}>
              {displayItems.map((item) => (
                <div key={item.label} className={styles.terminalRow}>
                  <div
                    className={styles.terminalBadge}
                    style={{ width: "110px", fontSize: "12px" }}
                  >
                    {item.label}
                  </div>
                  <div className={styles.terminalCell} style={{ flex: 1 }}>
                    <div className={styles.cellValue}>{item.value || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ShopModalContent.displayName = "ShopModalContent";
