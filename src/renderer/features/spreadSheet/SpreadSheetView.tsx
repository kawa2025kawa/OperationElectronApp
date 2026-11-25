// src/renderer/features/spreadSheet/SpreadSheetView.tsx

import { createElement, memo, useCallback, useMemo, type ReactNode } from "react";
import { useShallow } from "zustand/shallow";

import { AuthView } from "@renderer/features/auth/AuthView";
import { useAppStore, type AppState } from "@renderer/store";
import {
  SHEETS,
  type PublicJugyoin,
  type PublicKokyuhyo,
  type PublicShop,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { MODAL_SIZES } from "@shared/types/ui/modal";

import { ScheduleModalContent } from "./components/modal/ScheduleModalContent";
import {
  SpreadSheetTable,
  type SpreadSheetTableProps,
} from "./components/table/SpreadSheetTable";
import { isSpreadSheetHolidayText } from "./components/table/spreadsheetTableConfig";
import {
  getJugyoinColumns,
  getJugyoinRowId,
} from "./jugyoin/table/jugyoinTableConfig";
import {
  getKokyuhyoColumns,
  getKokyuhyoRowId,
} from "./kokyuhyo/table/kokyuhyoTableConfig";
import { ShopModalContent } from "./shop/modal/ShopModalContent";
import { getShopRowId, SHOP_COLUMNS } from "./shop/table/shopTableConfig";
import { resolveScheduleBaseDate } from "./utils/spreadsheetDateUtils";
import * as styles from "./spreadSheetView.css";

type SheetRow<T extends SheetId> = SheetData<T>[number];
type OpenSpreadsheetModal = AppState["openGlobalModal"];

const EMPTY_SHEET_ROWS: readonly never[] = Object.freeze([]);

interface BaseSpreadSheetViewProps<T extends SheetId> {
  sheetId: T;
  columns: SpreadSheetTableProps<SheetRow<T>>["columns"];
  getRowId: (row: SheetRow<T>, index: number) => string;
  onRowClick: (row: SheetRow<T>, openModal: OpenSpreadsheetModal) => void;
  headerVariant?: "grouped" | "standard";
  placeholderColumnId?: string;
  placeholderContent?: ReactNode;
  isHolidayCell?: (value: unknown) => boolean;
}

function BaseSpreadSheetView<T extends SheetId>({
  sheetId,
  columns,
  getRowId,
  onRowClick,
  headerVariant,
  placeholderColumnId,
  placeholderContent,
  isHolidayCell,
}: BaseSpreadSheetViewProps<T>) {
  const { openGlobalModal, isAuthenticated, rows, sheetError } = useAppStore(
    useShallow((state: AppState) => ({
      openGlobalModal: state.openGlobalModal,
      isAuthenticated: state.isAuthenticated,
      rows: (state.sheetData[sheetId]?.data ?? EMPTY_SHEET_ROWS) as SheetData<T>,
      sheetError: state.sheetErrors[sheetId],
    })),
  );

  const handleRowClick = useCallback(
    (row: SheetRow<T>) => onRowClick(row, openGlobalModal),
    [onRowClick, openGlobalModal],
  );

  if (!isAuthenticated) return <AuthView />;

  return (
    <div className={styles.viewContainer}>
      <div className={styles.inner}>
        <div className={styles.tableArea}>
          {sheetError ? (
            <div className={styles.errorContainer} role="alert">
              <div className={styles.errorTitle}>データ取得エラー</div>
              <div className={styles.errorMessage}>{sheetError}</div>
            </div>
          ) : (
            <SpreadSheetTable
              rows={rows}
              columns={columns}
              getRowId={getRowId}
              onRowClick={handleRowClick}
              headerVariant={headerVariant}
              placeholderColumnId={placeholderColumnId}
              placeholderContent={placeholderContent}
              isHolidayCell={isHolidayCell}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const JugyoinView = memo(function JugyoinView() {
  const jugyoinUpdatedAt = useAppStore(
    (state: AppState) => state.dailyUpdateStatus?.jugyoinUpdatedAt,
  );
  const baseDate = useMemo(
    () => resolveScheduleBaseDate(jugyoinUpdatedAt),
    [jugyoinUpdatedAt],
  );
  const columns = useMemo(() => getJugyoinColumns(baseDate), [baseDate]);

  const handleOpenModal = useCallback(
    (row: PublicJugyoin, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ScheduleModalContent, { data: row }), {
        title: row.name || "",
        ...MODAL_SIZES.ULTRA_WIDE_21_9,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.JUGYOIN.sheetName}
      columns={columns}
      getRowId={getJugyoinRowId}
      onRowClick={handleOpenModal}
      isHolidayCell={isSpreadSheetHolidayText}
    />
  );
});
JugyoinView.displayName = "JugyoinView";

export const KokyuhyoView = memo(function KokyuhyoView() {
  const kokyuhyoUpdatedAt = useAppStore(
    (state: AppState) => state.dailyUpdateStatus?.kokyuhyoUpdatedAt,
  );
  const baseDate = useMemo(
    () => resolveScheduleBaseDate(kokyuhyoUpdatedAt),
    [kokyuhyoUpdatedAt],
  );
  const columns = useMemo(() => getKokyuhyoColumns(baseDate), [baseDate]);

  const handleOpenModal = useCallback(
    (row: PublicKokyuhyo, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ScheduleModalContent, { data: row }), {
        title: row.name || "",
        ...MODAL_SIZES.KOKYUHYO,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.KOKYUHYO.sheetName}
      columns={columns}
      getRowId={getKokyuhyoRowId}
      onRowClick={handleOpenModal}
      isHolidayCell={isSpreadSheetHolidayText}
    />
  );
});
KokyuhyoView.displayName = "KokyuhyoView";

export const ShopView = memo(function ShopView() {
  const handleOpenModal = useCallback(
    (row: PublicShop, openModal: OpenSpreadsheetModal) => {
      openModal(createElement(ShopModalContent, { data: row }), {
        title: row.shopName || "",
        ...MODAL_SIZES.SHOP,
      });
    },
    [],
  );

  return (
    <BaseSpreadSheetView
      sheetId={SHEETS.STORE.sheetName}
      columns={SHOP_COLUMNS}
      getRowId={getShopRowId}
      onRowClick={handleOpenModal}
      headerVariant="standard"
    />
  );
});
ShopView.displayName = "ShopView";
