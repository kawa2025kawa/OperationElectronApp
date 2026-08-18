// src/renderer/features/spreadSheet/components/modal/contents/shop/ShopModalContent.tsx

import React from "react";
import { CloseButton } from "@renderer/components/ui/button/closeButton/CloseButton";
import type { Shop } from "@shared/types/spreadsheetTypes";
import * as styles from "@renderer/features/spreadSheet/components/modal/spreadSheetModal.css";
import {
  useTabbedModalLogic,
  type TabGroupConfig,
} from "../common/useTabbedModalLogic";

// ⭕ export を外してファイル内ローカル定数に変更
const SHOP_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "基本情報",
    items: [
      { key: "businessHours", label: "営業時間" },
      { key: "phoneNumber", label: "電話番号" },
      { key: "idoHanbai", label: "移動販売" },
      { key: "address", label: "住所" },
    ],
  },
  {
    title: "担当者情報",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "担当センター" },
    ],
  },
  {
    title: "プリンター(K)",
    items: [
      { key: "printerK.model", label: "K機種" },
      { key: "printerK.serial", label: "Kシリアル" },
      { key: "printerK.callTarget", label: "K連絡先" },
      { key: "printerK.weekendSupport", label: "K休日対応" },
      { key: "printerK.contractId", label: "K契約ID" },
    ],
  },
  {
    title: "プリンター(B)",
    items: [
      { key: "printerB.model", label: "B機種" },
      { key: "printerB.serial", label: "Bシリアル" },
      { key: "printerB.callTarget", label: "B連絡先" },
      { key: "printerB.weekendSupport", label: "B休日対応" },
      { key: "printerB.contractId", label: "B契約ID" },
    ],
  },
  {
    title: "プリンター(O)",
    items: [
      { key: "printerO.model", label: "O機種" },
      { key: "printerO.serial", label: "Oシリアル" },
      { key: "printerO.callTarget", label: "O連絡先" },
      { key: "printerO.weekendSupport", label: "O休日対応" },
      { key: "printerO.contractId", label: "O契約ID" },
    ],
  },
] as const;

export interface ShopModalContentProps {
  data: Shop;
  title: string;
  onClose: () => void;
}

export const ShopModalContent: React.FC<ShopModalContentProps> = React.memo(
  ({ data, title, onClose }) => {
    const { groups, selectedIndex, setSelectedIndex, displayItems } =
      useTabbedModalLogic(
        data as unknown as Record<string, unknown>,
        SHOP_MODAL_GROUPS,
      );

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
