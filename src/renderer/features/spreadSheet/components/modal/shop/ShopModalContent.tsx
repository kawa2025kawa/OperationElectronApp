// src/renderer/features/spreadSheet/components/modal/shop/ShopModalContent.tsx

import React from "react";
import type { AppViewDefinition } from "@renderer/registry/appRegistry";
import { SHEET_IDS, type Shop } from "@shared/types/spreadsheetTypes";
import type { Column } from "@shared/types/tableType";
import { APP_VIEW_IDS } from "@shared/types/uiType";
import {
  type TabGroupConfig,
  useSpreadSheetTabData,
} from "../hooks/useSpreadSheetTabData";
import type { SpreadSheetModalProps } from "../modalRegistry";
import * as styles from "./ShopModalContent.css";

const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "code", label: "店番", width: "10%" },
  { key: "name", label: "店舗名", width: "20%" },
  { key: "phoneNumber", label: "電話番号", width: "15%" },
  { key: "postalCode", label: "郵便番号", width: "15%" },
  { key: "address", label: "住所", width: "40%" },
] as const;

export const shopViewConfig: AppViewDefinition = {
  id: APP_VIEW_IDS.SHOP,
  title: "Shop",
  component: null,
  isProtected: true,
  sidebarMenu: { show: true, order: 4 },
  sheetId: SHEET_IDS.SHOP,
  search: {
    placeholder: "検索...",
    searchKeys: [
      "code",
      "name",
      "nameKana",
      "address",
      "managerName",
      "phoneNumber",
      "centerName",
    ],
  },
  modalConfig: {
    modalType: "sheet_shop",
    modalSize: { width: "80vw", height: "80vh" },
  },
  columns: SHOP_COLUMNS as readonly Column<unknown>[],
};

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
    key: `printer${type}.${subKey}`,
    label: `${type} ${label}`,
  })),
});

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
    title: "担当者",
    items: [
      { key: "managerName", label: "店長" },
      { key: "subManagerName1", label: "副店長1" },
      { key: "area", label: "エリア" },
      { key: "areaManagerName", label: "エリアMGR" },
      { key: "centerName", label: "センター" },
    ],
  },
  createPrinterGroup("K"),
  createPrinterGroup("B"),
  createPrinterGroup("O"),
] as const;

export const ShopModalContent: React.FC<SpreadSheetModalProps<Shop>> =
  React.memo(({ data }) => {
    const { selectedIndex, setSelectedIndex, groups, displayItems } =
      useSpreadSheetTabData(
        data as unknown as Record<string, unknown>,
        SHOP_MODAL_GROUPS,
      );

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
