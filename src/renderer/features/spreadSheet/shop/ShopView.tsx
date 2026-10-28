// src/renderer/features/spreadSheet/shop/ShopView.tsx

import { memo, useCallback } from "react";
import type { Shop } from "@shared/types/spreadsheet/shop";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { AuthView } from "@renderer/features/auth/AuthView";

import { useSpreadSheetDomainLogic } from "../hooks/useSpreadSheetDomainLogic";
import { ShopTable } from "./table/ShopTable";
import { ShopModalContent } from "./modal/ShopModalContent";
import * as styles from "../kokyuhyo/spreadSheetView.css";

export const ShopView = memo(function ShopView() {
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
