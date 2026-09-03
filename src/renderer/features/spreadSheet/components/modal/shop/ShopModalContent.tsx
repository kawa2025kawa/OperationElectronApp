// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx
import React from "react";
import type { Shop } from "@shared/types/spreadsheet";
import {
  type TabGroupConfig,
  useSpreadSheetTabData,
} from "@renderer/features/spreadSheet/components/modal/hooks/useSpreadSheetTabData";
import type { SpreadSheetModalProps } from "@renderer/features/spreadSheet/components/modal/modalRegistry";
import * as styles from "./shopModalContent.css";

// ----------------------------------------------------------------------------
// Constants & Configs
// ----------------------------------------------------------------------------
const PRINTER_FIELDS = [
  { subKey: "model", label: "型番" },
  { subKey: "serial", label: "シリアル" },
  { subKey: "callTarget", label: "連絡先" },
  { subKey: "weekendSupport", label: "休保" },
  { subKey: "contractId", label: "契約ID" },
] as const;

const createPrinterGroup = (type: "K" | "B" | "O"): TabGroupConfig => ({
  title: `プリンタ (${type})`,
  items: PRINTER_FIELDS.map(({ subKey, label }) => ({
    key: `printers.${type}.${subKey}`,
    label: `${type} ${label}`,
  })),
});

const SHOP_MODAL_GROUPS: readonly TabGroupConfig[] = [
  {
    title: "基本情報",
    items: [
      { key: "businessHours.display", label: "営業時間" },
      { key: "contact.phoneNumber", label: "電話番号" },
      { key: "mobileSales", label: "移動販売" },
      { key: "location.address", label: "住所" },
    ],
  },
  {
    title: "担当者",
    items: [
      { key: "managers.manager", label: "店長" },
      { key: "managers.subManager1", label: "副店長1" },
      { key: "location.area", label: "エリア" },
      { key: "managers.areaManager", label: "エリアMGR" },
      { key: "location.centerName", label: "センター" },
    ],
  },
  createPrinterGroup("K"),
  createPrinterGroup("B"),
  createPrinterGroup("O"),
] as const;

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------
export const ShopModalContent: React.FC<SpreadSheetModalProps<Shop>> =
  React.memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, groups, displayItems } =
      useSpreadSheetTabData(data, SHOP_MODAL_GROUPS);

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
