// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import { memo, useCallback, type ComponentType } from "react";
import { AuthView } from "@renderer/features/auth/AuthView";
import { MODAL_SIZES } from "@shared/types/ui/modal";
import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Jugyoin } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Kokyuhyo } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Shop } from "@shared/types/spreadsheet/spreadsheetTypes";

import { useSpreadSheetDomainLogic } from "@renderer/features/spreadSheet/hooks/useSpreadSheetDomainLogic";
import { ScheduleModalContent } from "@renderer/features/spreadSheet/components/modal/ScheduleModalContent";
import { ShopModalContent } from "@renderer/features/spreadSheet/shop/modal/ShopModalContent";
import { JugyoinTable } from "@renderer/features/spreadSheet/jugyoin/table/JugyoinTable";
import { KokyuhyoTable } from "@renderer/features/spreadSheet/kokyuhyo/table/KokyuhyoTable";
import { ShopTable } from "@renderer/features/spreadSheet/shop/table/ShopTable";
import * as styles from "@renderer/features/spreadSheet/spreadSheetView.css";

interface SpreadSheetViewProps<T> {
  sheetId: SheetId;
  TableComponent: ComponentType<{
    rows: readonly T[];
    onRowClick?: (item: T) => void;
  }>;
  onRowClick: (
    item: T,
    openModal: (
      content: React.ReactNode,
      config: { title: string; width: string; height: string },
    ) => void,
  ) => void;
}

function BaseSpreadSheetView<T>({
  sheetId,
  TableComponent,
  onRowClick,
}: SpreadSheetViewProps<T>) {
  const { isAuthenticated, data, openGlobalModal } =
    useSpreadSheetDomainLogic<T>(sheetId);

  const handleRowClick = useCallback(
    (row: T) => {
      onRowClick(row, openGlobalModal);
    },
    [onRowClick, openGlobalModal],
  );

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className={styles.viewContainer}>
      <div className={styles.inner}>
        <div className={styles.tableArea}>
          <TableComponent rows={data} onRowClick={handleRowClick} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 個別 View の定義（appRegistry から直接使用可能）
 * ============================================================ */

export const JugyoinView = memo(function JugyoinView() {
  const handleRowClick = useCallback(
    (
      row: Jugyoin,
      openModal: (
        content: React.ReactNode,
        config: { title: string; width: string; height: string },
      ) => void,
    ) => {
      openModal(<ScheduleModalContent data={row} variant="jugyoin" />, {
        title: row.name || "",
        ...MODAL_SIZES.ULTRA_WIDE_21_9,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView<Jugyoin>
      sheetId={SHEETS.JUGYOIN.sheetName}
      TableComponent={JugyoinTable}
      onRowClick={handleRowClick}
    />
  );
});
JugyoinView.displayName = "JugyoinView";

export const KokyuhyoView = memo(function KokyuhyoView() {
  const handleRowClick = useCallback(
    (
      row: Kokyuhyo,
      openModal: (
        content: React.ReactNode,
        config: { title: string; width: string; height: string },
      ) => void,
    ) => {
      openModal(<ScheduleModalContent data={row} variant="kokyuhyo" />, {
        title: row.name || "",
        ...MODAL_SIZES.KOKYUHYO,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView<Kokyuhyo>
      sheetId={SHEETS.KOKYUHYO.sheetName}
      TableComponent={KokyuhyoTable}
      onRowClick={handleRowClick}
    />
  );
});
KokyuhyoView.displayName = "KokyuhyoView";

export const ShopView = memo(function ShopView() {
  const handleRowClick = useCallback(
    (
      row: Shop,
      openModal: (
        content: React.ReactNode,
        config: { title: string; width: string; height: string },
      ) => void,
    ) => {
      openModal(<ShopModalContent data={row} />, {
        title: row.shopName || "",
        ...MODAL_SIZES.SHOP,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView<Shop>
      sheetId={SHEETS.STORE.sheetName}
      TableComponent={ShopTable}
      onRowClick={handleRowClick}
    />
  );
});
ShopView.displayName = "ShopView";


