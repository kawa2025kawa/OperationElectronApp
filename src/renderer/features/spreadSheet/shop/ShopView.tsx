// src/renderer/features/spreadSheet/shop/ShopView.tsx

import { memo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Column } from "@shared/types/table/tableType";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import {
  APP_VIEW_IDS,
  type AppViewDefinition,
} from "@shared/types/registry/viewDefinition";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { ShopTable } from "./table/ShopTable";
import { ShopModalContent } from "./modal/ShopModalContent";
import * as styles from "./ShopView.css";

// --- テーブルカラム定義 ---
export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  {
    key: "shopCode",
    label: "店舗コード",
    width: "10%",
  },
  {
    key: "shopName",
    label: "店舗名",
    width: "20%",
  },
  {
    key: "phoneNumber",
    label: "電話番号",
    width: "15%",
  },
  {
    key: "postalCode",
    label: "郵便番号",
    width: "15%",
  },
  {
    key: "address",
    label: "住所",
    width: "40%",
  },
] as const;

// --- コンポーネント本体 ---
export const ShopView = memo(() => {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<Shop>(SHEETS.STORE.sheetName);

  const handleRowClick = useCallback(
    (row: Shop) => {
      const title = row.shopName || "";

      openGlobalModal(<ShopModalContent data={row} />, {
        title,
        width: "80vw",
        height: "80vh",
      });
    },
    [openGlobalModal],
  );

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className={styles.viewContainer}>
      <div className={styles.inner}>
        <div className={styles.tableArea}>
          <ShopTable rows={data} onRowClick={handleRowClick} />
        </div>
      </div>
    </div>
  );
});

ShopView.displayName = "ShopView";

// --- ビュー設定定義 ---
export const shopViewConfig: AppViewDefinition<Shop> = {
  id: APP_VIEW_IDS.SHOP,
  title: "店舗情報",
  component: ShopView,
  isProtected: true,

  sidebarMenu: {
    show: true,
    order: 4,
  },

  sheetId: SHEETS.STORE.sheetName,

  search: {
    placeholder: "店舗コード、店舗名、住所等で検索...",
    searchKeys: [
      "shopCode",
      "shopName",
      "shopKana",
      "address",
      "phoneNumber",
      "centerName",
    ],
  },

  columns: SHOP_COLUMNS,
};
